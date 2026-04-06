'use client';
import { useState, useEffect } from 'react';

export default function Countdown() {
  const targetDate = new Date("2025-05-22T00:00:00Z").getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-4 text-center justify-center flex-wrap">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[80px]">
        <span className="text-4xl font-bold block">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-xs text-gray-500 uppercase mt-1 block">Days</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[80px]">
        <span className="text-4xl font-bold block">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-xs text-gray-500 uppercase mt-1 block">Hours</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[80px]">
        <span className="text-4xl font-bold block">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-xs text-gray-500 uppercase mt-1 block">Mins</span>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[80px]">
        <span className="text-4xl font-bold block">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-xs text-gray-500 uppercase mt-1 block">Secs</span>
      </div>
    </div>
  );
}
