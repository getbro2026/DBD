export const colors = {
  bg: '#FFF1F6',
  bgMid: '#EAF9FB',
  bgEnd: '#FFF8E1',
  surface: 'rgba(255,255,255,0.62)',
  surfaceSolid: '#FFFFFF',
  line: 'rgba(255,255,255,0.95)',
  edge: 'rgba(28,20,36,0.14)',
  text: '#1C1424',
  muted: '#5E5470',
  accent: '#FF4D7E',
  accentText: '#C0225A',
  onAccent: '#1C1424',
  original: '#BFE9ED',
  originalChip: 'rgba(255,255,255,0.7)',
  originalFigure: '#17A2AE',
  response: '#FFD0DD',
  responseChip: 'rgba(255,255,255,0.7)',
  responseFigure: '#E8346F',
  sun: '#FFC93C',
  ok: '#1E8F55',
  danger: '#C0225A',
};

export const radius = { sm: 16, md: 22, lg: 28, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/** Frosted white panel used for cards, bars and sheets. */
export const glass = {
  backgroundColor: 'rgba(255,255,255,0.62)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.95)',
  shadowColor: '#783C64',
  shadowOpacity: 0.18,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
} as const;
