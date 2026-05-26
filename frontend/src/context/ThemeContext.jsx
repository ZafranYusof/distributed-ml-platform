import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { themes, getThemeById } from '../data/themes';

const ThemeContext = createContext(null);

const DEFAULT_THEME_ID = 'neural-network';
const STORAGE_KEY = 'ml-platform-theme';

function applyThemeToDOM(themeObj) {
  const root = document.documentElement;
  
  // Apply CSS variables
  Object.entries(themeObj.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply dark/light class for Tailwind
  if (themeObj.type === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Apply body background
  document.body.style.background = 'linear-gradient(180deg, ' + themeObj.cssVars['--theme-bg-deep'] + ' 0%, ' + themeObj.cssVars['--theme-bg-surface'] + ' 100%)';
  
  // Update scrollbar colors
  root.style.setProperty('--scrollbar-track', themeObj.cssVars['--theme-scrollbar-track']);
  root.style.setProperty('--scrollbar-thumb', themeObj.cssVars['--theme-scrollbar-thumb']);
  root.style.setProperty('--scrollbar-hover', themeObj.cssVars['--theme-scrollbar-hover']);
}

export function ThemeProvider({ children }) {
  const [currentThemeId, setCurrentThemeId] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME_ID;
  });

  const currentTheme = getThemeById(currentThemeId);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentThemeId);
    applyThemeToDOM(currentTheme);
  }, [currentThemeId, currentTheme]);

  const setTheme = useCallback((themeId) => {
    const found = themes.find(t => t.id === themeId);
    if (found) {
      setCurrentThemeId(themeId);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    // Toggle between current theme and a light/dark counterpart
    if (currentTheme.type === 'dark') {
      setTheme('clean-white');
    } else {
      setTheme('neural-network');
    }
  }, [currentTheme, setTheme]);

  // Legacy compat: expose 'theme' as 'dark'/'light' string
  const theme = currentTheme.type;

  return (
    <ThemeContext.Provider value={{
      theme,
      currentTheme,
      currentThemeId,
      setTheme,
      toggleTheme,
      allThemes: themes,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
