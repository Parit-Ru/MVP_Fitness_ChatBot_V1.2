import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoute from "./routes/ai.js";
import os from "os"; // Added for memory info

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://parit-iii.github.io",
    "https://parit-Ru.github.io",
    "http://localhost:3000"
  ]
}));

app.use(express.json());

// ✅ New Route to check RAM usage on Render
app.get("/api/status", (req, res) => {
  const usedMemory = process.memoryUsage().rss / 1024 / 1024; // Convert to MB
  const totalMemory = os.totalmem() / 1024 / 1024;
  
  res.status(200).json({
    status: "online",
    memoryUsage: `${usedMemory.toFixed(2)} MB`,
    systemTotalMemory: `${totalMemory.toFixed(2)} MB`,
    uptime: `${process.uptime().toFixed(2)} seconds`
  });
});

app.use("/api/ai", aiRoute);

app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

app.listen(PORT, () => {
  const initialMemory = process.memoryUsage().rss / 1024 / 1024;
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📊 Initial RAM Usage: ${initialMemory.toFixed(2)} MB`);
});
