export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export interface JarvisRingProps {
  rotation: number;
  size: number;
  dashed?: boolean;
  reverse?: boolean;
  speed?: number;
}

export type LiveConfig = {
  model: string;
  systemInstruction?: string;
  voiceName?: string;
};

export type PanelContent = {
  title: string;
  type: 'text' | 'image' | 'map' | 'timer' | 'empty';
  content: string; // Text, Image URL, Map Query, or ISO Date string for timer
};