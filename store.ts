import { create } from 'zustand';
import { AppMode, PhotoData } from './types';

interface AppState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  
  photos: PhotoData[];
  addPhoto: (url: string) => void;
  
  cameraRotation: { x: number, y: number };
  setCameraRotation: (x: number, y: number) => void;
  
  zoomPhotoIndex: number;
  setZoomPhotoIndex: (index: number) => void;

  handDetected: boolean;
  setHandDetected: (detected: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  mode: AppMode.TREE,
  setMode: (mode) => set({ mode }),
  
  photos: [],
  addPhoto: (url) => set((state) => ({ 
    photos: [...state.photos, { id: crypto.randomUUID(), url }] 
  })),

  cameraRotation: { x: 0, y: 0 },
  setCameraRotation: (x, y) => set({ cameraRotation: { x, y } }),

  zoomPhotoIndex: 0,
  setZoomPhotoIndex: (index) => set({ zoomPhotoIndex: index }),

  handDetected: false,
  setHandDetected: (detected) => set({ handDetected: detected }),
}));