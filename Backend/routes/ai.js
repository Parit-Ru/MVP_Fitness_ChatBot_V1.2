import "dotenv/config";
import express from "express";
import axios from "axios";
import similarity from "compute-cosine-similarity";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

console.log("✅ ai.js loaded");
//console.log("GROQ_API_KEY =", process.env.GROQ_API_KEY);

const router = express.Router();
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

const HF_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`;

const groq = async (messages, max_tokens = 900) => {
  const res = await axios.post(
    GROQ_URL,
    {
      model: MODEL,
      messages,
      temperature: 0.7,
      max_tokens,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return res.data.choices[0].message.content;
};

const embedText = async (text) => {
  try {
    const response = await axios.post(
      HF_API_URL,
      {
        inputs: text,
        options: { wait_for_model: true },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    );

    // ✅ FIX: Extract the vector properly.
    // Hugging Face often returns [[0.1, 0.2...]] for this model.
    const result = response.data;
    return Array.isArray(result[0]) ? result[0] : result;
  } catch (err) {
    console.error("❌ EMBEDDING ERROR:", err.response?.data || err.message);
    throw err;
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const exercisesPath = path.join(__dirname, "../data/Exe.json"); // Adjust path if needed
const exercisesData = JSON.parse(fs.readFileSync(exercisesPath, "utf8"));

const findSimilarExercisesLocal = async (
  queryVector,
  limit = 5,
  avoidPart = "None",
) => {
  return exercisesData
    .filter((ex) => {
      // 1. ตรวจสอบว่ามี vector หรือไม่
      const hasVector = ex.embedding && Array.isArray(ex.embedding);

      // 2. ตรวจสอบว่าไม่ใช่ส่วนที่ต้องเลี่ยง (Case-insensitive)
      // ถ้า avoidPart เป็น "None" จะให้ผ่านหมด แต่ถ้ามีระบุ จะต้องไม่ตรงกับ BodyPart ของท่า
      const isSafe =
        avoidPart === "None" ||
        ex.BodyPart.toLowerCase() !== avoidPart.toLowerCase();

      return hasVector && isSafe;
    })
    .map((ex) => ({
      ...ex,
      score: similarity(queryVector, ex.embedding) || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

/* ========================= */
/* ===== GENERATE PLAN ===== */
/* ========================= */
/* ========================= */
/* ===== GENERATE PLAN ===== */
/* ========================= */
router.post("/plan", async (req, res) => {
  console.log("📩 /plan called");
  const { age, weight, height, goal, injury, time, pref, daysPerWeek } =
    req.body;

  try {
    // --- ส่วนเดิมของคุณทั้งหมด (ห้ามแก้) ---
    const analysisPrompt = `
      The user says they have this injury: "${injury}" or preference: "${pref}".
      Which body part should they avoid exercising? 
      Strict Rule: return English ONLY
      Choose ONLY ONE from this list: 
      ['Abdominals', 'Abductors', 'Adductors', 'Biceps', 'Calves',
       'Chest', 'Forearms', 'Glutes', 'Hamstrings', 'Lats', 'Lower Back',
       'Middle Back', 'Traps', 'Quadriceps', 'Shoulders', 'Triceps'].
      If no specific body part should be avoided, return "None".
      Return ONLY the body part name or "None".
    `;

    const avoidPart = await groq([
      { role: "system", content: "You are a fitness expert." },
      { role: "user", content: analysisPrompt },
    ]);
    console.log(`🚫 AI decided to avoid: ${avoidPart}`);

    const userVector = await embedText(`${goal} ${pref}`);
    const topExercises = await findSimilarExercisesLocal(
      userVector,
      7,
      avoidPart.trim(),
    );
    const totalDays = Math.min(Math.max(parseInt(daysPerWeek) || 3, 1), 7);
    const contextText = topExercises
      .map(
        (ex) =>
          `---\nExercise: ${ex.Title}\nFocus: ${ex.BodyPart}\nDescription: ${ex.Desc}`,
      )
      .join("\n\n");

    const prompt = `
  You are a professional personal trainer.
  
  STRICT RULES:
  - Create a workout plan with EXACTLY ${totalDays} workout days
- The "days" array length MUST be ${totalDays}
  - Make a workout plan that suit user needs
  - Match exercises to the user's goal
  - If user wants to avoid a body part, replace with other muscle 
  - Return ONLY valid JSON (Very Important)
  - English only
  - No explanation text
  - Only use Exercise name from the following list

  Exercise List:
  ${contextText}

  User's Information:
  - age: ${age}
  - weight: ${weight} kg
  - height: ${height} cm
  - goal: ${goal}
  - injury: ${injury || "None"}
  - free time: ${time} minute/day
  - additional: ${pref}

  OUTPUT FORMAT EXACTLY JSON:
  {
    "days": [
      {
        "day": "Day 1",
        "exercises": [
          { "name": "Squat", "sets": 3, "reps": 12 }
        ]
      }
    ]
  }
  `;

    const content = await groq([
      { role: "system", content: "คุณเป็นเทรนเนอร์ฟิตเนสระดับมืออาชีพ" },
      { role: "user", content: prompt },
    ]);

    const cleanJson = content.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleanJson);

    // ✅ ส่วนที่เพิ่มตามสั่ง: Mapping ข้อมูลจาก Exe.json เข้าไปใน plan
    plan.days = plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((aiEx) => {
        // หาข้อมูลจากไฟล์ Exe.json (ที่โหลดไว้ใน exercisesData)
        const masterData = exercisesData.find(
          (ex) => ex.Title.toLowerCase() === aiEx.name.toLowerCase(),
        );

        if (masterData) {
          return {
            ...aiEx, // { name, sets, reps }
            bodyPart: masterData.BodyPart,
            desc: masterData.Desc,
            equipment: masterData.Equipment,
            level: masterData.Level,
            type: masterData.Type,
          };
        }
        return aiEx;
      }),
    }));

    // ส่งผลลัพธ์กลับ (โครงสร้างเดิมแต่ข้อมูลใน exercises เยอะขึ้น)
    res.json({ plan });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Plan generation failed" });
  }
});

/* ===================== */
/* ===== CHAT ======== */
/* ===================== */
router.post("/chat", async (req, res) => {
  const { messages } = req.body;

  console.log("📩 /chat called");
  console.log("MESSAGES:", messages);

  try {
    const reply = await groq(
      [
        {
          role: "system",
          content: `
You are FitPro AI Coach, a friendly and professional fitness assistant.

Rules:
- Do NOT repeat onboarding questions if the user already answered them
- If user mentions a goal (lose weight, build muscle, endurance), remember it
- Ask ONE clear follow-up question only when needed
- Give short, practical advice (no essays)
- Be conversational and motivating
- Do NOT restart the conversation
`,
        },
        ...(messages || []),
      ],
      300,
    );

    res.json({ reply });
  } catch (err) {
    console.error("❌ GROQ CHAT ERROR");
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Chat failed" });
  }
});

/* ========================= */
/* ===== UPDATE PLAN ======= */
/* ========================= */
/* ========================= */
/* ===== UPDATE PLAN ======= */
/* ========================= */
router.post("/update-plan", async (req, res) => {
  const { currentPlan, instruction } = req.body;

  try {
    const intentCheck = await groq([
      {
        role: "system",
        content: `You are a filter. Determine if the user's input is a request to modify, add, remove, or change a workout plan.
         Respond with ONLY 'true' or 'false'.`,
      },
      { role: "user", content: `Instruction: "${instruction}"` },
    ]);

    console.log(intentCheck);
    const isWorkoutRelated = /true/i.test(intentCheck);
    console.log(isWorkoutRelated);

    if (!isWorkoutRelated) {
      return res.status(400).json({
        error: "Off-topic instruction",
        message:
          "It looks like you're asking about something else. Please provide instructions related to your workout plan.",
      });
    }

    const prompt = `
You are updating a workout plan.
You are a professional personal trainer.
STRICT RULES:
- Never remove all exercises from a day
- If an exercise is removed, REPLACE it with a suitable alternative
- Keep at least 2–4 exercises per day
- Match replacement exercises to the user's goal
- If user wants to avoid a body part, replace with other muscle
- Return ONLY valid JSON
- Same structure as input
- English only
- No explanation text

CURRENT PLAN:
${JSON.stringify(currentPlan)}

USER REQUEST:
"${instruction}"

OUTPUT FORMAT EXACTLY:
{
  "days": [
    {
      "day": "Day 1",
      "exercises": [
        { "name": "Exercise", "sets": 3, "reps": 12 }
      ]
    }
  ]
}
`;

    const content = await groq([
      { role: "system", content: "Workout plan editor (JSON only)" },
      { role: "user", content: prompt },
    ]);

    const cleanJson = content.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(cleanJson);

    // ✅ เพิ่มเฉพาะส่วนที่ดึงข้อมูล Master มาแปะ (ไม่ยุ่งกับ Prompt)
    plan.days = plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((aiEx) => {
        // หาข้อมูลจากไฟล์ Exe.json (ที่โหลดไว้ใน exercisesData)
        const masterData = exercisesData.find(
          (ex) => ex.Title.toLowerCase() === aiEx.name.toLowerCase(),
        );

        if (masterData) {
          return {
            ...aiEx, // { name, sets, reps }
            bodyPart: masterData.BodyPart,
            desc: masterData.Desc,
            equipment: masterData.Equipment,
            level: masterData.Level,
            type: masterData.Type,
          };
        }
        return aiEx;
      }),
    }));

    res.json({ plan });
  } catch (err) {
    console.error("UPDATE ERROR:", err.message);
    res.status(500).json({ error: "Update failed" });
  }
});

export default router;
