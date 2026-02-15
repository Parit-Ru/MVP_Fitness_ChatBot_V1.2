import { useState, useEffect } from 'react';
import { ArrowLeft, Flame, Repeat, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { Exercise } from './ExercisePlans';
import { db } from '../firebase'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface ExerciseDetailProps {
  exercise: Exercise;
  planName: string;
  onBack: () => void;
  onComplete?: () => void;
  userId: string; // ✅ เพิ่ม userId เข้ามาใน Props
}

const TEST_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

const getYouTubeID = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function ExerciseDetail({ exercise, planName, onBack, onComplete, userId }: ExerciseDetailProps) {
  // ✅ ใส่ตรงนี้เลย

  // console.log(exercise)
  const videoToDisplay = exercise.videoURL || TEST_YOUTUBE_URL;

  if (!exercise) {
    return <div className="p-8">Exercise not found</div>;
  }

  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  // Calculate total workout time based on exercise type
  const totalSets = exercise.sets;
  const hasTimedSets = exercise.duration !== undefined;

  // Parse duration if it exists (e.g., "45 sec" -> 45)
  const parseDuration = (duration: string | undefined): number => {
    if (!duration) return 0;
    const match = duration.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // Estimate time for rep-based exercises (e.g., "12-15" -> ~40 seconds at 3 sec per rep)
  // const estimateRepTime = (reps: string): number => {
  //   const match = reps.match(/(\d+)/);
  //   if (!match) return 60; // default 60 seconds
  //   const repCount = parseInt(match[1]);
  //   return Math.max(repCount * 0, 0); // 3 seconds per rep, minimum 30 seconds 3, 30
  // };

  // Estimate time for rep-based exercises
const estimateRepTime = (reps: string | number | undefined | null): number => {
  if (reps == null) return 60;

  const repsStr = String(reps); // ⭐ จุดสำคัญ
  const match = repsStr.match(/(\d+)/);

  if (!match) return 60; // default 60 seconds

  const repCount = parseInt(match[1], 10);
  return Math.max(repCount * 0, 0); // 3 sec/rep, ขั้นต่ำ 30 วิ
};


  const setDurationSeconds = hasTimedSets 
    ? parseDuration(exercise.duration)
    : estimateRepTime(exercise.reps);

  const [timeRemaining, setTimeRemaining] = useState(setDurationSeconds);

  useEffect(() => {
  // Use ReturnType to automatically get the correct type for your environment
  let interval: ReturnType<typeof setInterval> | null = null;

  if (isTimerRunning && !isCompleted && timeRemaining > 0) {
    interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [isTimerRunning, isCompleted, timeRemaining]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const handleReset = () => {
    setIsTimerRunning(false);
    setTimeRemaining(setDurationSeconds);
    setCurrentSet(1);
    setIsCompleted(false);
  };

  const handleNextSet = () => {
    if (currentSet < totalSets) {
      setCurrentSet(currentSet + 1);
      setTimeRemaining(setDurationSeconds);
      setIsTimerRunning(false);
    } else {
      setIsTimerRunning(false);
      setIsCompleted(true);
    }
  };

// ในไฟล์ ExerciseDetail.tsx
const handleMarkComplete = async () => {
  if (!userId || !exercise?.Title) return;

  try {
    // ✅ This forces the date to be calculated based on Thailand Timezone
    // regardless of the user's device settings.
    const thailandDate = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Asia/Bangkok',
    }); 
    // Result format: "2026-02-15" (en-CA gives YYYY-MM-DD)

    const workoutRef = doc(db, 'users', userId, 'workouts', thailandDate);

    await setDoc(workoutRef, {
      completed: true,
      timestamp: serverTimestamp(), // Firestore server time (UTC) for precise ordering
      localDate: thailandDate,       // Your "Streak Date" (Thailand)
      exerciseName: exercise.Title,
      planName: planName,
    }, { merge: true });

    // console.log(`Saved to Thailand Date: ${thailandDate}`);
    if (onComplete) onComplete();
    onBack();
  } catch (error) {
    console.error(error);
  }
};


  // Check if current set is complete
  const isSetComplete = timeRemaining === 0;

  // Calculate progress percentage
  // ✅ แก้เป็น (ดักกรณี setDurationSeconds เป็น 0 หรือ NaN)
const progressPercentage = setDurationSeconds > 0 
  ? ((setDurationSeconds - timeRemaining) / setDurationSeconds) * 100 
  : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Plans
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <p className="text-indigo-100 mb-2">{planName}</p>
          <h1 className="text-4xl font-bold mb-4">{exercise.Title}</h1>
          
          <div className="flex items-center gap-6 text-indigo-100">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              <span>{exercise.sets} sets × {exercise.reps}</span>
            </div>
            {exercise.duration && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{exercise.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Timer Section */}
          {!isCompleted && (
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-8">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Set {currentSet} of {totalSets}
                </h3>
                {hasTimedSets ? (
                  <>
                    <div className={`text-6xl font-bold mb-2 transition-colors ${
                      timeRemaining <= 5 && timeRemaining > 0 ? 'text-red-600' : 'text-indigo-600'
                    }`}>
                      {formatTime(timeRemaining)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Hold for {exercise.duration}
                    </p>
                  </>
                ) : (
                  <>
                    <div className={`text-6xl font-bold mb-2 transition-colors ${
                      timeRemaining <= 5 && timeRemaining > 0 ? 'text-red-600' : 'text-indigo-600'
                    }`}>
                      {formatTime(timeRemaining)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Complete {exercise.reps} reps
                    </p>
                  </>
                )}
              </div>

              {/* Timer Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleStartPause}
                  disabled={isSetComplete}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isTimerRunning ? (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      {timeRemaining === setDurationSeconds ? 'Start' : 'Resume'}
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>

                {isSetComplete && (
                  <button
                    onClick={handleNextSet}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium animate-pulse"
                  >
                    {currentSet < totalSets ? 'Next' : 'Finish'}
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      timeRemaining <= 5 && timeRemaining > 0 ? 'bg-red-600' : 'bg-indigo-600'
                    }`}
                    style={{
                      width: `${Math.min(progressPercentage, 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 text-center mt-2">
                  {Math.round(progressPercentage)}% complete
                </p>
              </div>
            </div>
          )}

          {/* Video Tutorial */}
           <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Video Tutorial</h3>
            {videoToDisplay ? (
              <div className="rounded-lg overflow-hidden aspect-video shadow-lg border border-gray-200">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube-nocookie.com/embed/${getYouTubeID(videoToDisplay)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Video tutorial coming soon</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-700 leading-relaxed">{exercise.Desc}</p>
          </div>

          {/* Instructions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Equipment</h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <span className="font-bold">🛠️</span>
                </div>
                <p className="text-xl text-gray-800 font-medium">
                  {exercise.equipment || exercise.Equipment || "No Equipment Required"}
                </p>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Body Part</h2>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="font-bold">💪</span>
                </div>
                <p className="text-xl text-indigo-900 font-bold uppercase tracking-wide">
                  {exercise.bodyPart || exercise.BodyPart || "General"}
                </p>
              </div>
            </div>
          </div>

          {/* Mark as Complete - Only shown when workout is finished */}
          {isCompleted && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Great Job!</h3>
              <p className="text-gray-600 mb-6">You completed all {totalSets} sets!</p>
              <button 
                onClick={handleMarkComplete}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium text-lg"
              >
                Mark as Complete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}