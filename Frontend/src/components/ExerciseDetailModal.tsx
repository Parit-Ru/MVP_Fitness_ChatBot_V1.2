import { X, Repeat, Flame, Clock } from 'lucide-react';
import { Exercise } from './ExercisePlans';
import { useEffect } from 'react'; // อย่าลืม import useEffect

interface ExerciseDetailModalProps {
  exercise: Exercise;
  onClose: () => void;
}

const TEST_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'

const getYouTubeID = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export function ExerciseDetailModal({ exercise, onClose }: ExerciseDetailModalProps) {

  const videoToDisplay = exercise.videoURL || TEST_YOUTUBE_URL;

  useEffect(() => {
    // เมื่อ Modal เปิด: สั่งล็อกการ scroll ที่ตัว Body
    document.body.style.overflow = 'hidden';

    // เมื่อ Modal ปิด (Cleanup function): คืนค่าการ scroll กลับมาเป็นปกติ
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{exercise.Title}</h2>
              <div className="flex items-center gap-4 text-indigo-100">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  <span className="text-sm">{exercise.sets} sets × {exercise.reps}</span>
                </div>
                {exercise.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{exercise.duration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  <span className="text-sm"></span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
            <p className="text-gray-700 leading-relaxed">{exercise.Desc}</p>
          </div>

          {/* Video placeholder */}
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

          {/* Instructions */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Equipment</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <span className="font-bold">🛠️</span>
              </div>
              <p className="text-lg text-gray-800 font-medium">
                {exercise.equipment || exercise.Equipment || "No Equipment Required"}
              </p>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Body Part</h3>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="font-bold">💪</span>
              </div>
              <p className="text-lg text-indigo-900 font-bold uppercase tracking-wide">
                {exercise.bodyPart || exercise.BodyPart || "General"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
