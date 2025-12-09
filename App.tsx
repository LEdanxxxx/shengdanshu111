import React from 'react';
import Scene from './components/Scene';
import UI from './components/UI';
import HandTracker from './components/HandTracker';

function App() {
  return (
    <div className="relative w-full h-screen bg-matteGreen overflow-hidden">
      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UI />
      </div>

      {/* Hand Tracking Logic (Invisible/Preview in corner) */}
      <HandTracker />
      
      {/* Decorative Vignette Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
}

export default App;