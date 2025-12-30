import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  primaryFont: string;
  headingFont: string;
}

interface ThemeContextType {
  theme: ThemeSettings;
  isLoading: boolean;
}

const defaultTheme: ThemeSettings = {
  primaryColor: "10 100% 60%",
  secondaryColor: "220 13% 91%",
  accentColor: "9 100% 60%",
  primaryFont: "Satoshi",
  headingFont: "Satoshi"
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  isLoading: false
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

  const { data: themeData, isLoading } = useQuery({
    queryKey: ["/api/theme-settings"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (themeData) {
      const settings = (themeData as any)?.data || themeData;
      
      const newTheme: ThemeSettings = {
        primaryColor: settings.theme_primary_color || defaultTheme.primaryColor,
        secondaryColor: settings.theme_secondary_color || defaultTheme.secondaryColor,
        accentColor: settings.theme_accent_color || defaultTheme.accentColor,
        primaryFont: settings.theme_primary_font || defaultTheme.primaryFont,
        headingFont: settings.theme_heading_font || defaultTheme.headingFont
      };

      setTheme(newTheme);
      applyTheme(newTheme);
    } else {
      applyTheme(defaultTheme);
    }
  }, [themeData]);

  const applyTheme = (themeSettings: ThemeSettings) => {
    const root = document.documentElement;
    
    root.style.setProperty('--primary', themeSettings.primaryColor);
    root.style.setProperty('--accent', themeSettings.accentColor);
    root.style.setProperty('--secondary', themeSettings.secondaryColor);
    
    if (themeSettings.primaryFont) {
      root.style.setProperty('--font-primary', themeSettings.primaryFont);
      document.body.style.fontFamily = `'${themeSettings.primaryFont}', sans-serif`;
    }
    
    if (themeSettings.headingFont) {
      root.style.setProperty('--font-heading', themeSettings.headingFont);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}
