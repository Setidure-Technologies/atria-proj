import { AlertTriangle, Clock } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  minutesLeft: number;
  onClose: () => void;
}

export function WarningModal({ isOpen, minutesLeft, onClose }: WarningModalProps) {
  if (!isOpen) return null;

  const isCritical = minutesLeft <= 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white rounded-lg p-6 max-w-md mx-4 ${isCritical ? 'border-2 border-red-500' : 'border-2 border-orange-500'}`}>
        <div className="text-center">
          <div className={`mx-auto mb-4 ${isCritical ? 'text-red-600' : 'text-orange-600'}`}>
            {isCritical ? <AlertTriangle size={48} /> : <Clock size={48} />}
          </div>
          
          <h3 className={`text-xl font-bold mb-2 ${isCritical ? 'text-red-900' : 'text-orange-900'}`}>
            {isCritical ? 'Final Warning!' : 'Time Warning'}
          </h3>
          
          <p className="text-gray-700 mb-4">
            {isCritical 
              ? `Only ${minutesLeft} minute remaining! The assessment will auto-submit when time expires.`
              : `${minutesLeft} minutes remaining. Please pace yourself accordingly.`
            }
          </p>
          
          <button
            onClick={onClose}
            className={`px-6 py-2 rounded-lg font-semibold text-white ${
              isCritical 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            Continue Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
