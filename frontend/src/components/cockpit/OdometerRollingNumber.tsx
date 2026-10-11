import React, { useEffect, useState } from 'react';

interface OdometerRollingNumberProps {
  value: number; // e.g. 1450000
  prefix?: string; // e.g. '₹'
  className?: string;
  durationMs?: number;
}

export const OdometerRollingNumber: React.FC<OdometerRollingNumberProps> = ({
  value,
  prefix = '₹',
  className = '',
  durationMs = 1400,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrameId: number;

    const startValue = 0;
    const targetValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);

      // Ease-out cubic curve (starts fast, slows down into exact mechanical stop)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (targetValue - startValue) * easeOut);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [value, durationMs]);

  // Format with Indian Rupee numbering commas
  const formatted = displayValue.toLocaleString('en-IN');

  return (
    <span className={`inline-flex items-baseline font-mono tracking-tight ${className}`}>
      {prefix && <span className="mr-0.5">{prefix}</span>}
      <span>{formatted}</span>
    </span>
  );
};
