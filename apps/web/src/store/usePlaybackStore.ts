import { create } from 'zustand';

interface PlaybackState {
  playing: boolean;
  currentStep: number;
  setPlaying: (playing: boolean) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  playing: false,
  currentStep: 0,
  setPlaying: (playing) => set({ playing }),
  setCurrentStep: (currentStep) => set({ currentStep }),
  reset: () => set({ playing: false, currentStep: 0 }),
}));
