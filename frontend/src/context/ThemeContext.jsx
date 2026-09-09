import React, { createContext, useState, useEffect, useLayoutEffect, useContext } from 'react';
import { flushSync } from 'react-dom';

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

  // Apply the theme class to <html> and persist the choice.
  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');

    // Remove the fallback transition class once colors have settled.
    const timer = setTimeout(() => root.classList.remove('theme-transitioning'), 350);
    return () => clearTimeout(timer);
  }, [darkMode]);

  const toggleTheme = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Preferred path: the View Transitions API crossfades the whole page in a
    // single GPU-composited pass, which is far smoother than transitioning
    // color properties on every element.
    if (typeof document.startViewTransition === 'function' && !prefersReducedMotion) {
      document.startViewTransition(() => {
        flushSync(() => setDarkMode((prev) => !prev));
      });
      return;
    }

    // Fallback: temporarily opt elements into a short color transition.
    document.documentElement.classList.add('theme-transitioning');
    setDarkMode((prev) => !prev);
  };

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
