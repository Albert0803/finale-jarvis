import React from 'react';

const ArcReactor: React.FC<{ isListening: boolean; isSpeaking: boolean }> = ({ isListening, isSpeaking }) => {
  return (
    <div className="relative w-[500px] h-[500px] flex items-center justify-center">
      {/* Outer Ring - Static dashed */}
      <div className="absolute inset-0 border-[2px] border-cyan-900/50 rounded-full border-dashed animate-[spin_60s_linear_infinite]" />
      
      {/* Ring 1 - Counter Clockwise */}
      <div className={`absolute w-[450px] h-[450px] border-[1px] border-cyan-500/30 rounded-full border-t-transparent border-l-transparent animate-[spin_10s_linear_infinite_reverse] ${isSpeaking ? 'border-cyan-400' : ''}`} />
      
      {/* Ring 2 - Clockwise Fast */}
      <div className="absolute w-[400px] h-[400px] rounded-full animate-[spin_20s_linear_infinite]">
         <div className="absolute top-0 left-1/2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#00f0ff]" />
         <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#00f0ff]" />
         <div className="absolute left-0 top-1/2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#00f0ff]" />
         <div className="absolute right-0 top-1/2 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_#00f0ff]" />
      </div>

      {/* Ring 3 - Dashed Active */}
      <div className={`absolute w-[350px] h-[350px] border-[4px] border-cyan-500/20 rounded-full border-dashed animate-[spin_30s_linear_infinite] ${isListening ? 'border-cyan-400/60 shadow-[0_0_20px_#00f0ff]' : ''}`} />

      {/* Ring 4 - Tech Marks */}
      <svg className="absolute w-[320px] h-[320px] animate-[spin_40s_linear_infinite]" viewBox="0 0 100 100">
        <path d="M 50 5 A 45 45 0 0 1 95 50" fill="none" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="1" />
        <path d="M 50 95 A 45 45 0 0 1 5 50" fill="none" stroke="rgba(6, 182, 212, 0.5)" strokeWidth="1" />
      </svg>
      
      {/* Center Text Container */}
      <div className="absolute z-30 flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-black tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_rgba(0,240,255,0.8)] mb-2">
          J.A.R.V.I.S.
        </h1>
        <div className="text-xs tracking-widest text-cyan-600 font-bold">
          {isListening ? 'LISTENING...' : isSpeaking ? 'SPEAKING' : 'STANDBY'}
        </div>
      </div>
    </div>
  );
};

export default ArcReactor;