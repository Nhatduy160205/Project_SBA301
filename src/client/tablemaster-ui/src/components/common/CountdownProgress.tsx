import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownProgressProps {
  initialSeconds?: number;
  onExpire?: () => void;
  size?: number;
  strokeWidth?: number;
}

export const CountdownProgress: React.FC<CountdownProgressProps> = ({
  initialSeconds = 300, // 5 minutes = 300s
  onExpire,
  size = 48,
  strokeWidth = 3.5,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onExpire]);

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = Math.max(0, secondsLeft / initialSeconds);
  const strokeDashoffset = circumference * (1 - progressRatio);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = secondsLeft < 60;

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isUrgent ? '#EF4444' : '#D97706'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500 animate-pulse' : 'text-amber-600'}`} />
        </div>
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Thời gian giữ chỗ</div>
        <div className={`text-sm font-bold font-mono ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-amber-700'}`}>
          {formattedTime}
        </div>
      </div>
    </div>
  );
};
