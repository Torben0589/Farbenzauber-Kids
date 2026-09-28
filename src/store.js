import { create } from 'zustand';

const LIMIT = 50;

export const useApp = create((set) => ({
  tool: 'fill',
  color: '#ff5d8f',
  brushSize: 24,
  dark: false,
  template: null,
  fills: {},
  history: [],
  future: [],
  paintSnapshot: null,
  status: 'Wähle ein Bild aus',

  setTool: (tool) => set({ tool }),
  setColor: (color) => set({ color }),
  setBrushSize: (brushSize) => set({ brushSize }),
  toggleDark: () => set((s) => ({ dark: !s.dark })),
  setStatus: (status) => set({ status }),

  openTemplate: (template) =>
    set({
      template,
      fills: {},
      history: [],
      future: [],
      paintSnapshot: null,
      status: 'Los geht’s!',
    }),

  commit: (next, paintSnapshot) =>
    set((s) => ({
      history: [...s.history.slice(-(LIMIT - 1)), { fills: s.fills, paintSnapshot: s.paintSnapshot }],
      future: [],
      fills: next,
      paintSnapshot: paintSnapshot ?? s.paintSnapshot,
    })),

  undo: () =>
    set((s) => {
      if (!s.history.length) return s;
      const prev = s.history.at(-1);
      return {
        ...prev,
        history: s.history.slice(0, -1),
        future: [{ fills: s.fills, paintSnapshot: s.paintSnapshot }, ...s.future],
      };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return s;
      const next = s.future[0];
      return {
        ...next,
        history: [...s.history, { fills: s.fills, paintSnapshot: s.paintSnapshot }].slice(-LIMIT),
        future: s.future.slice(1),
      };
    }),
}));
