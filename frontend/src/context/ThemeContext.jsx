import React, { createContext, useState, useEffect, useLayoutEffect, useContext } from 'react';

const ThemeContext = createContext(null);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) {
        return saved === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    
    // Add temporary class to enable smooth transition on theme switch
    root.classList.add('theme-transitioning');
    
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    const timer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 350);

    return () => clearTimeout(timer);
  }, [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback if component is rendered outside ThemeProvider
    return { darkMode: false, setDarkMode: () => {}, toggleTheme: () => {} };
  }
  return context;
};

