import React, { useRef } from 'react';
import { useStore } from '../store';
import { AppMode } from '../types';

const UI: React.FC = () => {
  const { mode, addPhoto, handDetected } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      addPhoto(url);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      
      {/* Header */}
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl md:text-6xl font-serif text-metallicGold drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] tracking-wider">
            NOEL LUXE
          </h1>
          <p className="text-champagne/80 font-sans tracking-widest text-sm mt-2 uppercase">
            Interactive Gesture Experience
          </p>
        </div>

        <div className="flex flex-col items-end pointer-events-auto gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="group relative px-6 py-2 overflow-hidden rounded-full bg-matteGreen/80 border border-metallicGold/50 hover:border-metallicGold transition-all duration-300 backdrop-blur-sm"
          >
            <span className="relative z-10 text-metallicGold font-serif text-sm group-hover:text-white transition-colors">
              + Add Memory
            </span>
            <div className="absolute inset-0 bg-metallicGold transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 opacity-20" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleUpload}
          />
        </div>
      </header>

      {/* Status Indicators */}
      <div className="absolute top-1/2 left-6 transform -translate-y-1/2 space-y-4">
         <StatusItem label="MODE" value={mode} active={true} />
         <StatusItem label="HAND" value={handDetected ? "DETECTED" : "SEARCHING..."} active={handDetected} color={handDetected ? "text-green-400" : "text-red-400"} />
      </div>

      {/* Instructions */}
      <footer className="flex justify-center pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
          <InstructionCard icon="✊" title="CLOSE" desc="Form a fist to build the tree" active={mode === AppMode.TREE} />
          <InstructionCard icon="🖐" title="SCATTER" desc="Open hand to scatter magic" active={mode === AppMode.SCATTER} />
          <InstructionCard icon="👋" title="ROTATE" desc="Move hand in scatter mode" active={mode === AppMode.SCATTER} />
          <InstructionCard icon="🤏" title="GRAB" desc="Pinch to inspect memories" active={mode === AppMode.ZOOM} />
        </div>
      </footer>
    </div>
  );
};

const StatusItem = ({ label, value, active, color = "text-metallicGold" }: { label: string, value: string, active: boolean, color?: string }) => (
  <div className={`transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-50'}`}>
    <div className="text-[10px] text-white/50 tracking-widest mb-1">{label}</div>
    <div className={`font-serif text-xl ${color} drop-shadow-md`}>{value}</div>
  </div>
);

const InstructionCard = ({ icon, title, desc, active }: { icon: string, title: string, desc: string, active: boolean }) => (
  <div className={`text-center transition-all duration-300 ${active ? 'scale-110 opacity-100' : 'opacity-60 grayscale'}`}>
    <div className="text-3xl mb-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{icon}</div>
    <div className="text-xs font-bold text-metallicGold tracking-wider mb-1">{title}</div>
    <div className="text-[10px] text-champagne leading-tight w-20 mx-auto">{desc}</div>
  </div>
);

export default UI;