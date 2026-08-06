'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'slate';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'light', setTheme: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    // Strictly enforcing the dark theme for the Aether aesthetic
    setTheme('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  const handleSetTheme = (t: Theme) => {
    setTheme(t);
    localStorage.setItem('aether-theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);