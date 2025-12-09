import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { AppMode } from '../types';

// Thresholds
const PINCH_THRESHOLD = 0.05;

const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { setMode, setCameraRotation, mode, setHandDetected, photos, setZoomPhotoIndex } = useStore();
  const [streamStarted, setStreamStarted] = useState(false);
  const lastVideoTime = useRef(-1);
  const handLandmarkerRef = useRef<any>(null);

  useEffect(() => {
    const initMediaPipe = async () => {
      const vision = window.vision;
      if (!vision) return;

      const filesetResolver = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );

      handLandmarkerRef.current = await vision.HandLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      startWebcam();
    };

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", () => {
             setStreamStarted(true);
          });
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    initMediaPipe();
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const detect = () => {
      if (videoRef.current && handLandmarkerRef.current && streamStarted) {
        let startTimeMs = performance.now();
        if (videoRef.current.currentTime !== lastVideoTime.current) {
          lastVideoTime.current = videoRef.current.currentTime;
          
          const results = handLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

          if (results.landmarks && results.landmarks.length > 0) {
            setHandDetected(true);
            const landmarks = results.landmarks[0];
            processGestures(landmarks);
          } else {
            setHandDetected(false);
          }
        }
      }
      animationFrameId = requestAnimationFrame(detect);
    };

    detect();
    return () => cancelAnimationFrame(animationFrameId);
  }, [streamStarted, mode, photos.length]);

  const processGestures = (landmarks: any[]) => {
    // 1. Calculate finger states (Tips vs PIP joints)
    // Thumb: 4, Index: 8, Middle: 12, Ring: 16, Pinky: 20
    // PIP: Thumb: 2, Index: 6, Middle: 10, Ring: 14, Pinky: 18 (Using MCP/PIP comparison for simplicity)
    
    // Check if fingers are extended (Tip y < PIP y is UP in image coords usually, but let's use distance from wrist)
    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    
    let extendedCount = 0;
    tips.forEach((tipIdx, i) => {
      const pipIdx = pips[i];
      // Simple distance check: is tip further from wrist than pip?
      const distTip = Math.hypot(landmarks[tipIdx].x - wrist.x, landmarks[tipIdx].y - wrist.y);
      const distPip = Math.hypot(landmarks[pipIdx].x - wrist.x, landmarks[pipIdx].y - wrist.y);
      if (distTip > distPip + 0.02) extendedCount++;
    });

    // Thumb check separately (horizontal mostly)
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbBase = landmarks[2];
    // Check angle or distance. Simplified: distance from pinky base
    const distThumb = Math.hypot(thumbTip.x - landmarks[17].x, thumbTip.y - landmarks[17].y);
    const distThumbBase = Math.hypot(thumbBase.x - landmarks[17].x, thumbBase.y - landmarks[17].y);
    if (distThumb > distThumbBase) extendedCount++;


    // 2. Detect Pinch (Thumb Tip 4 and Index Tip 8)
    const pinchDist = Math.hypot(landmarks[4].x - landmarks[8].x, landmarks[4].y - landmarks[8].y);
    const isPinching = pinchDist < PINCH_THRESHOLD;

    // 3. Hand Centroid (for rotation)
    const centroidX = landmarks[9].x; // Middle finger MCP is a good center
    const centroidY = landmarks[9].y;

    // --- LOGIC ---

    // FIST (Close Tree)
    // 0 or 1 finger extended (often thumb is tricky) implies Fist
    if (extendedCount <= 1 && !isPinching) {
       if (mode !== AppMode.TREE) setMode(AppMode.TREE);
    }

    // OPEN PALM (Scatter)
    // 4 or 5 fingers
    if (extendedCount >= 4) {
      if (mode !== AppMode.SCATTER) setMode(AppMode.SCATTER);
    }

    // ROTATION (In Scatter mode)
    if (mode === AppMode.SCATTER) {
      // Map X (0-1) to rotation (-1 to 1 range roughly)
      // Mirror X because webcam is mirrored usually
      const rotX = (0.5 - centroidX) * 4; // Sensitivity
      const rotY = (0.5 - centroidY) * 2;
      setCameraRotation(rotX, rotY);
    }

    // GRAB (Zoom Photo)
    // Must be pinching, and currently in Scatter or Tree.
    // To avoid flickering, maybe require pinch to be held? 
    // For this demo, instant transition is more responsive.
    if (isPinching) {
       if (mode === AppMode.SCATTER || mode === AppMode.TREE) {
         setMode(AppMode.ZOOM);
         // Pick a random photo or cycle
         // If we had a cursor, we'd pick the one under cursor. 
         // Here we'll just pick a random one if not already zooming.
         if (mode !== AppMode.ZOOM && photos.length > 0) {
            const nextIndex = Math.floor(Math.random() * photos.length);
            setZoomPhotoIndex(nextIndex);
         }
       }
    } else {
        // Release pinch logic?
        // If we are in ZOOM and release pinch, maybe go back to Scatter?
        // For now, let's keep it sticky or let Open Palm reset it.
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
      <div className="relative rounded-xl overflow-hidden border-2 border-metallicGold shadow-lg shadow-gold/20 w-32 h-24 bg-black">
         <video 
           ref={videoRef} 
           autoPlay 
           muted 
           className="w-full h-full object-cover transform -scale-x-100 opacity-80"
         />
         {!streamStarted && (
           <div className="absolute inset-0 flex items-center justify-center text-xs text-metallicGold text-center p-1">
             Initializing Vision...
           </div>
         )}
      </div>
    </div>
  );
};

export default HandTracker;