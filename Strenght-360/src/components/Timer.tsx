import { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimerProps {
  duration: number; // duration in seconds
  onTimeUp: () => void;
  onWarning?: (minutesLeft: number) => void;
}

export function Timer({ duration, onTimeUp, onWarning }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        
        // Warning at 5 minutes (300 seconds)
        if (newTime === 300 && onWarning) {
          onWarning(5);
          setIsWarning(true);
        }
        
        // Critical warning at 1 minute (60 seconds)
        if (newTime === 60 && onWarning) {
          onWarning(1);
          setIsCritical(true);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp, onWarning]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isCritical) return 'text-red-600';
    if (isWarning) return 'text-orange-600';
    return 'text-gray-700';
  };

  const getBackgroundColor = () => {
    if (isCritical) return 'bg-red-50 border-red-200';
    if (isWarning) return 'bg-orange-50 border-orange-200';
    return 'bg-white border-gray-200';
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${getBackgroundColor()}`}>
      {(isWarning || isCritical) ? (
        <AlertTriangle className={`${getTimerColor()}`} size={20} />
      ) : (
        <Clock className={`${getTimerColor()}`} size={20} />
      )}
      <div className="flex flex-col">
        <span className={`font-mono text-lg font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </span>
        <span className="text-xs text-gray-500">Time Remaining</span>
      </div>
    </div>
  );
}
