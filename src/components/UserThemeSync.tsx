import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { applyPaletteToDOM, ColorPalette } from '@/hooks/useThemeCustomizer';

const STORAGE_KEY = 'theme-customizer';

/**
 * Bridges per-user theme preferences (color palette + light/dark) between
 * the profiles table and local state, so the same user sees the same theme
 * across browsers and devices.
 *
 * - On login: load profile.theme + profile.color_palette and apply them.
 * - On theme change (from next-themes): persist back to profile.
 */
export function UserThemeSync() {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const loadedForUserId = useRef<string | null>(null);
  const lastPersistedTheme = useRef<string | null>(null);

  // Load preferences when the user logs in / changes
  useEffect(() => {
    if (!currentUser?.id) {
      loadedForUserId.current = null;
      return;
    }
    if (loadedForUserId.current === currentUser.id) return;
    loadedForUserId.current = currentUser.id;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('theme, color_palette')
        .eq('id', currentUser.id)
        .maybeSingle();
      if (cancelled || error || !data) return;

      // Apply palette
      const palette = data.color_palette as ColorPalette | null;
      if (palette && palette.primary) {
        applyPaletteToDOM(palette);
        // Mirror to localStorage so useThemeCustomizer picks it up
        try {
          const existing = localStorage.getItem(STORAGE_KEY);
          const parsed = existing ? JSON.parse(existing) : {};
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...parsed, currentPalette: palette }),
          );
        } catch { /* ignore */ }
      }

      // Apply theme (light/dark/system)
      if (data.theme && data.theme !== theme) {
        lastPersistedTheme.current = data.theme;
        setTheme(data.theme);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // Persist theme changes back to profile
  useEffect(() => {
    if (!currentUser?.id || !theme) return;
    if (lastPersistedTheme.current === theme) return;
    // Avoid persisting on the very first mount before profile load completes
    if (loadedForUserId.current !== currentUser.id) return;
    lastPersistedTheme.current = theme;
    supabase
      .from('profiles')
      .update({ theme })
      .eq('id', currentUser.id)
      .then(({ error }) => {
        if (error) console.warn('Failed to sync theme to profile', error);
      });
  }, [theme, currentUser?.id]);

  return null;
}
