import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  destructive: string;
}

const defaultPalettes: ColorPalette[] = [
  {
    id: 'default',
    name: 'Default (Indigo)',
    primary: '239 84% 67%',
    accent: '262 83% 58%',
    success: '142 71% 45%',
    warning: '38 92% 50%',
    destructive: '0 84% 60%',
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    primary: '199 89% 48%',
    accent: '187 92% 40%',
    success: '160 84% 39%',
    warning: '45 93% 47%',
    destructive: '0 72% 51%',
  },
  {
    id: 'forest',
    name: 'Forest Green',
    primary: '142 76% 36%',
    accent: '160 84% 39%',
    success: '120 60% 45%',
    warning: '45 93% 47%',
    destructive: '0 84% 60%',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    primary: '24 95% 53%',
    accent: '339 90% 51%',
    success: '142 71% 45%',
    warning: '45 93% 47%',
    destructive: '0 84% 60%',
  },
  {
    id: 'purple',
    name: 'Royal Purple',
    primary: '271 91% 65%',
    accent: '291 64% 42%',
    success: '142 71% 45%',
    warning: '38 92% 50%',
    destructive: '0 84% 60%',
  },
  {
    id: 'rose',
    name: 'Rose Pink',
    primary: '346 77% 50%',
    accent: '339 90% 51%',
    success: '142 71% 45%',
    warning: '38 92% 50%',
    destructive: '0 84% 60%',
  },
];

const STORAGE_KEY = 'theme-customizer';

function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return '#6366f1';

  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function applyPaletteToDOM(palette: ColorPalette) {
  const root = document.documentElement;
  root.style.setProperty('--primary', palette.primary);
  root.style.setProperty('--accent', palette.accent);
  root.style.setProperty('--success', palette.success);
  root.style.setProperty('--warning', palette.warning);
  root.style.setProperty('--destructive', palette.destructive);
  root.style.setProperty('--ring', palette.primary);
  root.style.setProperty('--sidebar-primary', palette.primary);
  root.style.setProperty('--sidebar-ring', palette.primary);
  root.style.setProperty('--chart-1', palette.primary);
  root.style.setProperty('--chart-2', palette.accent);
  root.style.setProperty('--chart-3', palette.success);
  root.style.setProperty('--chart-4', palette.warning);
  root.style.setProperty('--chart-5', palette.destructive);
}

export { defaultPalettes };

/** Persist current palette to the authenticated user's profile (best-effort). */
async function persistPaletteToProfile(palette: ColorPalette) {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data?.session?.user?.id;
    if (!userId) return;
    await supabase.from('profiles').update({ color_palette: palette as any }).eq('id', userId);
  } catch (e) {
    // non-fatal: localStorage still holds it
    console.warn('Failed to sync palette to profile', e);
  }
}

export function useThemeCustomizer() {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(defaultPalettes[0]);
  const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.currentPalette) {
          setCurrentPalette(data.currentPalette);
          applyPaletteToDOM(data.currentPalette);
        }
        if (data.customPalettes) {
          setCustomPalettes(data.customPalettes);
        }
      } catch (e) {
        console.error('Failed to load theme settings:', e);
      }
    }
  }, []);

  const saveToStorage = (palette: ColorPalette, custom: ColorPalette[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currentPalette: palette,
      customPalettes: custom,
    }));
  };

  const selectPalette = (palette: ColorPalette) => {
    setCurrentPalette(palette);
    applyPaletteToDOM(palette);
    saveToStorage(palette, customPalettes);
    persistPaletteToProfile(palette);
  };

  const createCustomPalette = (name: string, colors: { primary: string; accent: string }) => {
    const newPalette: ColorPalette = {
      id: `custom-${Date.now()}`,
      name,
      primary: hexToHSL(colors.primary),
      accent: hexToHSL(colors.accent),
      success: '142 71% 45%',
      warning: '38 92% 50%',
      destructive: '0 84% 60%',
    };
    const updated = [...customPalettes, newPalette];
    setCustomPalettes(updated);
    selectPalette(newPalette);
    saveToStorage(newPalette, updated);
    return newPalette;
  };

  const deleteCustomPalette = (id: string) => {
    const updated = customPalettes.filter(p => p.id !== id);
    setCustomPalettes(updated);
    if (currentPalette.id === id) {
      selectPalette(defaultPalettes[0]);
    }
    saveToStorage(currentPalette.id === id ? defaultPalettes[0] : currentPalette, updated);
  };

  const resetToDefault = () => {
    selectPalette(defaultPalettes[0]);
  };

  return {
    currentPalette,
    defaultPalettes,
    customPalettes,
    selectPalette,
    createCustomPalette,
    deleteCustomPalette,
    resetToDefault,
    hexToHSL,
    hslToHex,
  };
}
