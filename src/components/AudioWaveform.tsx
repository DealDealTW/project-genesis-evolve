import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isListening: boolean;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isListening }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let audioContext: AudioContext | null = null;

    const setupAudio = async () => {
      try {
        // 初始化音頻上下文和分析器
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        // 取得麥克風流
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        
        // 連接音頻源到分析器
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        // 設置數據陣列
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        
        // 開始繪製動畫
        startDrawing();
      } catch (err) {
        console.error("無法訪問麥克風:", err);
      }
    };

    const startDrawing = () => {
      if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      const draw = () => {
        if (!isListening) {
          // 如果不再聆聽，繪製靜態波形
          ctx.fillStyle = 'rgb(34, 34, 34)';
          ctx.fillRect(0, 0, width, height);
          
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgb(160, 160, 160)';
          ctx.beginPath();
          
          const sliceWidth = width / 64;
          let x = 0;
          
          for (let i = 0; i < 64; i++) {
            const v = 0.1; // 小振幅
            const y = (v * height / 2) + (height / 2);
            
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
          }
          
          ctx.lineTo(width, height / 2);
          ctx.stroke();
          return;
        }
        
        animationRef.current = requestAnimationFrame(draw);
        
        if (!analyserRef.current || !dataArrayRef.current) return;
        
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        
        ctx.fillStyle = 'rgb(34, 34, 34)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgb(82, 196, 26)'; // 綠色波形
        ctx.beginPath();
        
        const sliceWidth = width / dataArrayRef.current.length;
        let x = 0;
        
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = dataArrayRef.current[i] / 128.0;
          const y = (v * height / 2);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          
          x += sliceWidth;
        }
        
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      };
      
      draw();
    };

    const cleanupAudio = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };

    if (isListening) {
      setupAudio();
    }

    return () => {
      cleanupAudio();
    };
  }, [isListening]);

  return (
    <div className="relative w-full">
      <canvas 
        ref={canvasRef} 
        width={200} 
        height={60} 
        className={`w-full rounded-md border ${isListening ? 'border-green-500' : 'border-gray-300'}`}
      />
      {isListening && (
        <div className="absolute top-1 right-2 flex items-center">
          <span className="animate-pulse mr-1 h-2 w-2 rounded-full bg-red-500"></span>
          <span className="text-xs text-red-500">錄音中</span>
        </div>
      )}
    </div>
  );
};

export default AudioWaveform; 