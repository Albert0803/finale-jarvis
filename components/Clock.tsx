import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-8 right-8 flex flex-col items-end z-40">
      <div className="text-4xl font-black text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] tracking-widest">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-cyan-700 font-bold tracking-[0.3em] mt-1">
        {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
      </div>
      <div className="w-full h-[2px] bg-cyan-900/50 mt-2 relative overflow-hidden">
         <div className="absolute top-0 left-0 h-full w-1/3 bg-cyan-400 animate-[slide_2s_ease-in-out_infinite]" />
      </div>
    </div>
  );
};

export default Clock;