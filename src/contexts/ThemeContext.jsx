import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first, then system preference
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    return "light";
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem("highContrast") === "true";
  });

  const [largeText, setLargeText] = useState(() => {
    return localStorage.getItem("largeText") === "true";
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem("reducedMotion") === "true" || 
           window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Handle theme
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);

    // Handle high contrast
    if (highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }
    localStorage.setItem("highContrast", highContrast);

    // Handle large text
    if (largeText) {
      root.classList.add("large-text");
    } else {
      root.classList.remove("large-text");
    }
    localStorage.setItem("largeText", largeText);

    // Handle reduced motion
    if (reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }
    localStorage.setItem("reducedMotion", reducedMotion);
  }, [theme, highContrast, largeText, reducedMotion]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => !prev);
  };

  const toggleLargeText = () => {
    setLargeText((prev) => !prev);
  };

  const toggleReducedMotion = () => {
    setReducedMotion((prev) => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        highContrast,
        toggleHighContrast,
        largeText,
        toggleLargeText,
        reducedMotion,
        toggleReducedMotion,
        isDark: theme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
