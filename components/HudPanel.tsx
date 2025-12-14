import React, { useEffect, useState } from 'react';
import { PanelContent } from '../types';

interface HudPanelProps {
  side: 'left' | 'right';
  data: PanelContent;
}

const HudPanel: React.FC<HudPanelProps> = ({ side, data }) => {
  if (data.type === 'empty') return null;

  return (
    <div className={`absolute top-[55%] transform -translate-y-1/2 w-[42vw] max-w-none h-[70vh] z-30 flex flex-col transition-all duration-700 ease-out ${side === 'left' ? 'left-6 items-start' : 'right-6 items-end'}`}>
      
      {/* Panel Header */}
      <div className={`flex items-center mb-4 w-full ${side === 'left' ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Hexagon icon */}
         <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-cyan-500/20 blur-md rounded-full"></div>
             <svg viewBox="0 0 24 24" className="w-full h-full text-cyan-400 animate-[spin_4s_linear_infinite]">
               <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zm0 9l2-1 8 4-10 5-10-5 8-4 2 1z"/>
               <path fill="none" stroke="currentColor" strokeWidth="1" d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
             </svg>
        </div>

        <div className={`h-[2px] bg-gradient-to-r from-cyan-500/0 via-cyan-400 to-cyan-500/0 flex-grow mx-4 relative`}>
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-200/50 transform -translate-y-1/2 blur-[1px]"></div>
        </div>
        
        <h3 className="text-cyan-400 font-black tracking-[0.3em] text-3xl whitespace-nowrap uppercase drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            {data.title}
        </h3>
      </div>

      {/* Main Glass Panel */}
      <div className={`relative flex-grow w-full bg-black/40 backdrop-blur-md border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(0,240,255,0.1)] overflow-hidden group ${side === 'left' ? 'rounded-tr-3xl rounded-bl-3xl' : 'rounded-tl-3xl rounded-br-3xl'}`}>
        
        {/* Holographic Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,240,255,0)_50%,rgba(0,240,255,0.05)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,6px_100%]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400/50 shadow-[0_0_15px_#00f0ff] animate-[scan_4s_linear_infinite] opacity-50 z-10 pointer-events-none"></div>

        {/* Tech Corners (SVG) */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20" fill="none" stroke="currentColor">
           {/* Top Left */}
           <path d="M 2 40 L 2 2 L 40 2" strokeWidth="2" className="text-cyan-500" />
           <path d="M 6 44 L 6 6 L 44 6" strokeWidth="1" className="text-cyan-500/50" />
           
           {/* Bottom Right */}
           <path d="M calc(100% - 2px) calc(100% - 40px) L calc(100% - 2px) calc(100% - 2px) L calc(100% - 40px) calc(100% - 2px)" strokeWidth="2" className="text-cyan-500" />
           
             {/* Dynamic Accent Lines */}
            <path d={`M ${side === 'left' ? 'calc(100% - 20px) 2' : '20 2'} L ${side === 'left' ? 'calc(100% - 2px) 20' : '2 20'}`} strokeWidth="2" className="text-cyan-400" />
        </svg>

        {/* Inner Content Area */}
        <div className="relative z-10 h-full flex flex-col">
            
            {/* Metadata Header */}
            <div className="flex justify-between text-[10px] text-cyan-600 font-mono mb-4 tracking-widest border-b border-cyan-500/20 pb-2">
                <span>SECURE_LINK::ESTABLISHED</span>
                <span>DATA_STREAM::{Math.floor(Math.random() * 9999)}</span>
            </div>

            {/* Content Type: Text */}
            {data.type === 'text' && (
            <div className="h-full relative overflow-hidden flex flex-col">
                <p className="text-cyan-100 text-lg leading-relaxed font-mono tracking-wider drop-shadow-[0_0_2px_rgba(0,240,255,0.5)] text-justify" style={{ textShadow: "0px 0px 8px rgba(0, 240, 255, 0.4)" }}>
                    {data.content}
                </p>
                
                {/* Decorative End Block */}
                <div className="mt-auto pt-4 flex items-center gap-2 opacity-60">
                     <div className="h-2 w-2 bg-cyan-500 animate-pulse"></div>
                     <div className="h-1 flex-grow bg-cyan-900/50">
                        <div className="h-full w-1/4 bg-cyan-500/50 animate-[slide_3s_linear_infinite]"></div>
                     </div>
                     <span className="text-xs text-cyan-500">END_OF_FILE</span>
                </div>
            </div>
            )}

             {/* Content Type: Timer */}
             {data.type === 'timer' && (
                <TimerDisplay targetTime={data.content} />
            )}

            {/* Content Type: Image */}
            {data.type === 'image' && (
            <div className="relative w-full h-full rounded-sm overflow-hidden border border-cyan-500/50 bg-cyan-900/10">
                <img 
                src={data.content} 
                alt={data.title} 
                className="w-full h-full object-cover object-top mix-blend-screen opacity-90 transition-opacity duration-500"
                style={{ filter: "contrast(1.2) brightness(1.1) drop-shadow(0 0 5px rgba(0,240,255,0.3))" }}
                onError={(e) => {
                    const img = e.currentTarget;
                    if (!img.dataset.hasRetried) {
                        img.dataset.hasRetried = 'true';
                        console.log("Image load failed. Attempting fallback generation for:", data.title);
                        img.src = `https://image.pollinations.ai/prompt/${encodeURIComponent(data.title)}?nologo=true`;
                    } else {
                        img.style.display = 'none';
                        const parent = img.parentElement;
                        if (parent) parent.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-cyan-500 font-mono"><span class="text-4xl mb-4 animate-pulse">⚠</span><span class="text-center">SIGNAL LOST<br/><span class="text-xs text-cyan-700">SOURCE ENCRYPTED</span></span></div>';
                    }
                }}
                />
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
                    <div className="bg-black/60 p-2 border-l-2 border-cyan-400">
                        <div className="text-[10px] text-cyan-300">ANALYSIS COMPLETED</div>
                        <div className="text-xs text-cyan-100 font-bold">MATCH: 99.9%</div>
                    </div>
                     <div className="w-16 h-16 border border-cyan-500/30 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite_reverse]">
                         <div className="w-12 h-12 border-t-2 border-cyan-400 rounded-full"></div>
                     </div>
                </div>
            </div>
            )}

            {/* Content Type: Map */}
            {data.type === 'map' && (
            <div className="relative w-full h-full overflow-hidden border border-cyan-500/50 bg-black">
                <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    style={{ border: 0, opacity: 0.8, filter: 'invert(100%) hue-rotate(180deg) brightness(0.8) contrast(1.2) saturate(0)' }} 
                    src={`https://www.google.com/maps?q=${encodeURIComponent(data.content)}&output=embed`} 
                    allowFullScreen
                ></iframe>
                
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
                
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="w-20 h-20 border-2 border-red-500/50 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                    </div>
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-red-400 text-xs font-bold tracking-widest bg-black/80 px-2">TARGET</div>
                </div>
            </div>
            )}
        </div>
      </div>
      
      {/* Footer Connection Line */}
      <div className={`mt-2 h-[2px] w-1/3 bg-cyan-800/50 ${side === 'left' ? 'self-start origin-left' : 'self-end origin-right'}`}>
          <div className="h-full w-full bg-cyan-400/30 animate-pulse"></div>
      </div>
    </div>
  );
};

const TimerDisplay: React.FC<{ targetTime: string }> = ({ targetTime }) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const target = new Date(targetTime).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = target - now;
            
            if (diff <= 0) {
                setTimeLeft(0);
                setIsExpired(true);
            } else {
                setTimeLeft(diff);
                setIsExpired(false);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [targetTime]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);

        return {
            h: hours.toString().padStart(2, '0'),
            m: minutes.toString().padStart(2, '0'),
            s: seconds.toString().padStart(2, '0'),
            ms: milliseconds.toString().padStart(2, '0')
        };
    };

    const time = formatTime(timeLeft);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full">
            <div className={`relative flex items-center justify-center p-10 border-4 rounded-full transition-colors duration-500 ${isExpired ? 'border-red-500 shadow-[0_0_50px_#ff0000]' : 'border-cyan-500 shadow-[0_0_30px_#00f0ff]'}`}>
                {/* Spinning Rings */}
                <div className={`absolute inset-0 rounded-full border-t-4 border-l-4 animate-[spin_3s_linear_infinite] ${isExpired ? 'border-red-500/50' : 'border-cyan-400/30'}`}></div>
                <div className={`absolute -inset-4 rounded-full border-b-2 border-r-2 animate-[spin_5s_linear_infinite_reverse] ${isExpired ? 'border-red-500/30' : 'border-cyan-400/20'}`}></div>

                {/* Digital Display */}
                <div className={`font-mono text-7xl font-bold tracking-widest tabular-nums z-10 ${isExpired ? 'text-red-500 animate-pulse' : 'text-cyan-100'}`} style={{ textShadow: isExpired ? "0 0 20px red" : "0 0 20px cyan" }}>
                    {time.h !== '00' && <span>{time.h}:</span>}
                    <span>{time.m}:{time.s}</span>
                    <span className="text-3xl opacity-70">.{time.ms}</span>
                </div>
            </div>
            
            {/* Status Text */}
            <div className={`mt-8 text-xl tracking-[0.5em] font-bold ${isExpired ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {isExpired ? 'TIME EXPIRED' : 'COUNTDOWN ACTIVE'}
            </div>
        </div>
    );
};

export default HudPanel;