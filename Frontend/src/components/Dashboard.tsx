import { useEffect, useState } from "react";
import {
  MessageCircle,
  Dumbbell,
  LogOut,
  X,
  List,
  User,
  BookOpen,
  MoreVertical,
} from "lucide-react";
import { ExercisePlans } from "./ExercisePlans";
import { Chatbot } from "./Chatbot";
import { ProfilePage } from "./ProfilePage";
import { Exercise } from "./ExercisePlans";
import { getExercises } from "../services/exerciseService";
import { WorkoutLibrary } from "./WorkoutLibrary";
import { ExerciseDetail } from "./ExerciseDetail";
import { PlanDetail } from "./PlanDetail";
import {
  doc,
  collection,
  query,
  setDoc,
  serverTimestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

interface DashboardProps {
  user: { name: string; email: string; uid: string };
  onLogout: () => void;
}

interface WorkoutStreak {
  date: string;
  completed: boolean;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [selectedPlanName, setSelectedPlanName] = useState<string>("");

  const [view, setView] = useState<
    "chat" | "plans" | "profile" | "workouts" | "exercise"
  >("chat");
  const [completedWorkouts, setCompletedWorkouts] = useState<WorkoutStreak[]>(
    [],
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);

  useEffect(() => {
    const q = query(collection(db, "exercises"), limit(20));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exercises = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          Title: data.Title || data.title || "Unknown Exercise",
          Desc: data.Desc || data.description || "",
          Type: data.Type || "Strength",
          BodyPart: data.BodyPart || "N/A",
          Equipment: data.Equipment || "N/A",
          Level: data.Level || "Intermediate",
          sets: data.sets || 3,
          reps: data.reps || "8-12",
          calories: data.calories || 60,
          instructions: data.instructions || [],
          tips: data.tips || [],
          videoURL: data.videoURL || "",
        } as Exercise;
      });

      setExerciseLibrary(exercises);
    });

    return () => unsubscribe();
  }, []);

  const handleAddManyExercises = (newExercises: Exercise[]) => {
    setExerciseLibrary((prev) => {
      // Create a map of existing IDs for quick lookup
      const existingIds = new Set(prev.map((ex) => ex.id));
      // Only add exercises that aren't already in the list
      const uniqueNew = newExercises.filter((ex) => !existingIds.has(ex.id));
      return [...prev, ...uniqueNew];
    });
  };

  const handleWorkoutComplete = async (date: string) => {
    if (!user.uid) return;

    try {
      const workoutRef = doc(db, "users", user.uid, "workouts", date);
      await setDoc(
        workoutRef,
        {
          completed: true,
          timestamp: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      console.error("Error saving workout:", error);
    }
  };

  const handleUpdateExercise = (exercise: Exercise) => {
    setExerciseLibrary((prev) =>
      prev.map((ex) => (ex.id === exercise.id ? exercise : ex)),
    );
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExerciseLibrary((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const handleAddExercise = (exercise: Exercise) => {
    setExerciseLibrary((prev) => [...prev, exercise]);
  };

  if (selectedExercise) {
    return (
      <div className="min-h-screen bg-white">
        <ExerciseDetail
          exercise={selectedExercise}
          planName={selectedPlanName}
          userId={user.uid}
          onBack={() => setSelectedExercise(null)}
          onComplete={() => {
            setSelectedExercise(null);
            setView("profile");
          }}
        />
      </div>
    );
  }

  if (selectedPlanId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PlanDetail
          planId={selectedPlanId}
          onBack={() => setSelectedPlanId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      <>
        <header className="glass-effect border-b border-white/20 shadow-lg relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Dumbbell className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                FitPro{" "}
              </h1>{" "}
              <p className="text-xs text-gray-600">
                {" "}
                Your fitness journey starts here{" "}
              </p>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  FitPro
                </h1>
                <p className="text-xs text-gray-600">
                  Your fitness journey starts here
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => {
                  setView("chat");
                  setSelectedPlanId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  view === "chat"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Chat
              </button>

              <button
                onClick={() => {
                  setView("plans");
                  setSelectedPlanId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  view === "plans"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <List className="w-5 h-5" />
                My Plans
              </button>

              <button
                onClick={() => {
                  setView("profile");
                  setSelectedPlanId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  view === "profile"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <User className="w-5 h-5" />
                Profile
              </button>

              <button
                onClick={() => {
                  setView("workouts");
                  setSelectedPlanId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                  view === "workouts"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-gray-700 hover:bg-white/60"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Workouts
              </button>

              <div className="w-px h-8 bg-gray-300 mx-2"></div>

              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>

            {/* Mobile Three-dot */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/60"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <MoreVertical className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Popup Menu */}
          {mobileMenuOpen && (
            <div className="absolute right-4 top-20 w-48 bg-white rounded-xl shadow-xl border py-2 md:hidden z-50">
              <MobileItem
                label="Chat"
                onClick={() => {
                  setView("chat");
                  setMobileMenuOpen(false);
                }}
              />
              <MobileItem
                label="My Plans"
                onClick={() => {
                  setView("plans");
                  setMobileMenuOpen(false);
                }}
              />
              <MobileItem
                label="Profile"
                onClick={() => {
                  setView("profile");
                  setMobileMenuOpen(false);
                }}
              />
              <MobileItem
                label="Workouts"
                onClick={() => {
                  setView("workouts");
                  setMobileMenuOpen(false);
                }}
              />

              <div className="border-t my-2" />

              <MobileItem label="Logout" danger onClick={onLogout} />
            </div>
          )}
        </header>

        <main className="flex-1 flex flex-col">
          {view === "chat" ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="w-full max-w-4xl h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl flex flex-col">
                <Chatbot
                  userName={user.name}
                  availableExercises={exerciseLibrary}
                  onNewExercisesFound={handleAddManyExercises}
                />
              </div>
            </div>
          ) : view === "plans" ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <ExercisePlans
                availableExercises={exerciseLibrary}
                onViewDetail={(id) => setSelectedPlanId(id)}
                onStartExercise={(exerciseFromPlan, planName) => {
                  const exerciseToView = {
                    ...exerciseFromPlan, // This spreads existing fields, but explicit mapping is safer for naming mismatches
                    Title: exerciseFromPlan.Title || exerciseFromPlan.name,
                    Desc: exerciseFromPlan.Desc || exerciseFromPlan.desc,
                    BodyPart:
                      exerciseFromPlan.BodyPart || exerciseFromPlan.bodyPart,
                    videoURL: exerciseFromPlan.videoURL, // <--- Add this line
                    id: exerciseFromPlan.id || `ex_${Date.now()}`,
                  } as Exercise;

                  setSelectedExercise(exerciseToView);
                  setSelectedPlanName(planName);
                }}
              />
            </div>
          ) : view === "profile" ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <ProfilePage userId={user.uid} userName={user.name} />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
              <WorkoutLibrary
                exercises={exerciseLibrary}
                onUpdateExercise={handleUpdateExercise}
                onDeleteExercise={handleDeleteExercise}
                onAddExercise={handleAddExercise}
              />
            </div>
          )}
        </main>
      </>
    </div>
  );
}

function MobileItem({ label, onClick, danger }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}
