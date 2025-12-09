export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  ZOOM = 'ZOOM'
}

export interface PhotoData {
  id: string;
  url: string;
}

export interface HandGesture {
  isFist: boolean;
  isOpen: boolean;
  isPinching: boolean;
  centroid: { x: number; y: number };
}

// Just for type safety when accessing window global from CDN
declare global {
  interface Window {
    vision: any;
  }
}