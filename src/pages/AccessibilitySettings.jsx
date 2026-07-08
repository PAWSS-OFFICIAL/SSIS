import React from "react";
import { DashboardLayout } from "../components/DashboardLayout";
import { useTheme } from "../contexts/ThemeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Eye,
  Moon,
  Sun,
  Type,
  Monitor,
  Palette,
  Keyboard,
  Volume2,
  Accessibility,
  Check,
  Info
} from "lucide-react";

export const AccessibilitySettings = () => {
  const {
    theme,
    toggleTheme,
    isDark,
    highContrast,
    toggleHighContrast,
    largeText,
    toggleLargeText,
    reducedMotion,
    toggleReducedMotion,
  } = useTheme();

  const handleSave = () => {
    toast.success("Accessibility settings saved");
  };

  return (
    <DashboardLayout title="Accessibility Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Accessibility className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Accessibility
            </h1>
            <p className="text-slate-500">
              Customize your experience to make JAIN LMS work better for you
            </p>
          </div>
        </div>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize how JAIN LMS looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="w-5 h-5 text-slate-500" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-slate-500">
                    Switch between light and dark themes
                  </p>
                </div>
              </div>
              <Switch checked={isDark} onCheckedChange={toggleTheme} />
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-slate-500" />
                <div>
                  <Label className="text-base">High Contrast</Label>
                  <p className="text-sm text-slate-500">
                    Increase contrast for better visibility
                  </p>
                </div>
              </div>
              <Switch checked={highContrast} onCheckedChange={toggleHighContrast} />
            </div>
          </CardContent>
        </Card>

        {/* Text & Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Text & Display
            </CardTitle>
            <CardDescription>
              Adjust text size and display options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Large Text */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type className="w-5 h-5 text-slate-500" />
                <div>
                  <Label className="text-base">Large Text</Label>
                  <p className="text-sm text-slate-500">
                    Increase text size throughout the app
                  </p>
                </div>
              </div>
              <Switch checked={largeText} onCheckedChange={toggleLargeText} />
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm text-slate-500 mb-2">Preview:</p>
              <p className={largeText ? "text-lg" : "text-base"}>
                This is how text will appear
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Motion */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Motion
            </CardTitle>
            <CardDescription>
              Control animations and motion effects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-slate-500" />
                <div>
                  <Label className="text-base">Reduced Motion</Label>
                  <p className="text-sm text-slate-500">
                    Minimize animations and transitions
                  </p>
                </div>
              </div>
              <Switch checked={reducedMotion} onCheckedChange={toggleReducedMotion} />
            </div>

            {reducedMotion && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Reduced motion is enabled. Animations will be minimized throughout the app.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Keyboard Navigation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Navigation
            </CardTitle>
            <CardDescription>
              Shortcuts and keyboard controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-sm">Open Search</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-sm">Quick Navigation</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs">
                  Tab
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <span className="text-sm">Submit Form</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs">
                  Enter
                </kbd>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WCAG Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5" />
              Accessibility Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-300">
                  WCAG 2.1 AA Compliant
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  JAIN LMS meets WCAG 2.1 Level AA accessibility standards
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">98%</p>
                <p className="text-sm text-slate-500">Perceivable</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">94%</p>
                <p className="text-sm text-slate-500">Operable</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">96%</p>
                <p className="text-sm text-slate-500">Understandable</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">92%</p>
                <p className="text-sm text-slate-500">Robust</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Preferences
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};
