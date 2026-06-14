import React, { createContext, useContext, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'dark',
  isDark: true,
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

const STORAGE_KEY = 'smoke_theme';

function loadTheme(systemScheme: string | null | undefined): ThemeMode {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {}
  }
  return systemScheme === 'light' ? 'light' : 'dark';
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(() => loadTheme(systemScheme));

  const toggleTheme = () => {
    setMode(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (Platform.OS === 'web') {
        try { localStorage.setItem(STORAGE_KEY, next); } catch {}
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark: mode === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
