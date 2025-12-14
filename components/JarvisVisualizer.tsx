import React, { useEffect, useRef } from 'react';
import { AudioVisualizerProps } from '../types';

const JarvisVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const dataArray = new Uint8Array(analyser ? analyser.frequencyBinCount : 0);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;

      ctx.clearRect(0, 0, width, height);

      // Base circle glow
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius - 5, 0, 2 * Math.PI);
      ctx.strokeStyle = isActive ? 'rgba(0, 240, 255, 0.4)' : 'rgba(0, 240, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
        
        ctx.beginPath();
        const bars = 60;
        const step = (Math.PI * 2) / bars;

        for (let i = 0; i < bars; i++) {
          const value = dataArray[i * 2] || 0; // Skip some frequencies for wider spread
          const barHeight = (value / 255) * 40; 
          
          const angle = i * step;
          
          // Outer bars
          const x1 = centerX + Math.cos(angle) * radius;
          const y1 = centerY + Math.sin(angle) * radius;
          const x2 = centerX + Math.cos(angle) * (radius + barHeight);
          const y2 = centerY + Math.sin(angle) * (radius + barHeight);

          // Inner bars (mirror)
          const x3 = centerX + Math.cos(angle) * (radius - barHeight * 0.5);
          const y3 = centerY + Math.sin(angle) * (radius - barHeight * 0.5);

          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          
          ctx.moveTo(x1, y1);
          ctx.lineTo(x3, y3);
        }
        
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f0ff';
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyser, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
    />
  );
};

export default JarvisVisualizer;