import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../theme/colors';

const defaultContextValue = {
  theme: lightTheme,
  colors: lightTheme,
  isDark: false,
  toggleTheme: () => {},
};

const ThemeContext = createContext(defaultContextValue);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const activeTheme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        colors: activeTheme,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context || !context.theme) {
    return defaultContextValue;
  }
  return context;
};

export default ThemeContext;
