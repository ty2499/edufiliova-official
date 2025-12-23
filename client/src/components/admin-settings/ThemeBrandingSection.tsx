import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, RefreshCw } from "lucide-react";
import { HexColorPicker } from "react-colorful";
import { useAdminSettingsSections } from "@/hooks/useAdminSettingsSections";

export function ThemeBrandingSection() {
  const {
    themeSettings,
    setThemeSettings,
    loadingTheme,
    saveThemeMutation,
    resetThemeMutation
  } = useAdminSettingsSections();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Theme & Branding</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Customize your application's colors and fonts. Changes will apply globally after refresh.
      </p>

      {loadingTheme ? (
        <div className="text-center py-8 text-gray-500">Loading theme settings...</div>
      ) : (
        <div className="space-y-8">
          <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-6 text-gray-900 dark:text-white">Color Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="mb-3 block">Primary Color</Label>
                <div className="space-y-3">
                  <HexColorPicker 
                    color={themeSettings.primaryColor} 
                    onChange={(color) => setThemeSettings({ ...themeSettings, primaryColor: color })}
                  />
                  <Input
                    value={themeSettings.primaryColor}
                    onChange={(e) => setThemeSettings({ ...themeSettings, primaryColor: e.target.value })}
                    placeholder="#0C332C"
                    data-testid="input-primary-color"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Secondary Color</Label>
                <div className="space-y-3">
                  <HexColorPicker 
                    color={themeSettings.secondaryColor} 
                    onChange={(color) => setThemeSettings({ ...themeSettings, secondaryColor: color })}
                  />
                  <Input
                    value={themeSettings.secondaryColor}
                    onChange={(e) => setThemeSettings({ ...themeSettings, secondaryColor: e.target.value })}
                    placeholder="#e7ebee"
                    data-testid="input-secondary-color"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-3 block">Accent Color</Label>
                <div className="space-y-3">
                  <HexColorPicker 
                    color={themeSettings.accentColor} 
                    onChange={(color) => setThemeSettings({ ...themeSettings, accentColor: color })}
                  />
                  <Input
                    value={themeSettings.accentColor}
                    onChange={(e) => setThemeSettings({ ...themeSettings, accentColor: e.target.value })}
                    placeholder="#0C332C"
                    data-testid="input-accent-color"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-6 text-gray-900 dark:text-white">Font Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="primary-font" className="mb-2 block">Primary Font (Body Text)</Label>
                <Select 
                  value={themeSettings.primaryFont} 
                  onValueChange={(value) => setThemeSettings({ ...themeSettings, primaryFont: value })}
                >
                  <SelectTrigger data-testid="select-primary-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Satoshi">Satoshi</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Nunito">Nunito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="heading-font" className="mb-2 block">Heading Font</Label>
                <Select 
                  value={themeSettings.headingFont} 
                  onValueChange={(value) => setThemeSettings({ ...themeSettings, headingFont: value })}
                >
                  <SelectTrigger data-testid="select-heading-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Satoshi">Satoshi</SelectItem>
                    <SelectItem value="Inter">Inter</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                    <SelectItem value="Nunito">Nunito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Preview</h3>
            <div className="space-y-4">
              <div 
                className="p-4 rounded-lg text-white"
                style={{ 
                  backgroundColor: themeSettings.primaryColor,
                  fontFamily: themeSettings.primaryFont
                }}
              >
                <p style={{ fontFamily: themeSettings.headingFont }} className="font-bold text-lg mb-2">
                  Heading with Primary Color
                </p>
                <p>This is body text using the primary font and primary color.</p>
              </div>

              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: themeSettings.secondaryColor,
                  fontFamily: themeSettings.primaryFont,
                  color: '#000'
                }}
              >
                <p>This shows the secondary color background.</p>
              </div>

              <Button
                style={{ 
                  backgroundColor: themeSettings.accentColor,
                  fontFamily: themeSettings.primaryFont
                }}
                className="text-white"
              >
                Button with Accent Color
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => saveThemeMutation.mutate()}
              disabled={saveThemeMutation.isPending}
              className="bg-primary hover:bg-primary"
              data-testid="button-save-theme"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveThemeMutation.isPending ? "Saving..." : "Save Theme"}
            </Button>

            <Button
              variant="outline"
              onClick={() => resetThemeMutation.mutate()}
              disabled={resetThemeMutation.isPending}
              data-testid="button-reset-theme"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {resetThemeMutation.isPending ? "Resetting..." : "Reset to Defaults"}
            </Button>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> After saving theme changes, refresh the page to see them applied across the application.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
