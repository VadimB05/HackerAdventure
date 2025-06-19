"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Settings, Volume2, VolumeX, Monitor, Moon, Sun } from 'lucide-react';

interface OptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GameOptions {
  language: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  theme: 'light' | 'dark' | 'auto';
  fullscreen: boolean;
}

const defaultOptions: GameOptions = {
  language: 'de',
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 80,
  musicVolume: 60,
  theme: 'dark',
  fullscreen: false
};

export function OptionsModal({ isOpen, onClose }: OptionsModalProps) {
  const [options, setOptions] = useState<GameOptions>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gameOptions');
      return saved ? { ...defaultOptions, ...JSON.parse(saved) } : defaultOptions;
    }
    return defaultOptions;
  });

  const saveOptions = (newOptions: GameOptions) => {
    setOptions(newOptions);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gameOptions', JSON.stringify(newOptions));
    }
  };

  const updateOption = <K extends keyof GameOptions>(key: K, value: GameOptions[K]) => {
    const newOptions = { ...options, [key]: value };
    saveOptions(newOptions);
  };

  const resetToDefaults = () => {
    saveOptions(defaultOptions);
  };

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  const themes = [
    { value: 'light', label: 'Hell', icon: Sun },
    { value: 'dark', label: 'Dunkel', icon: Moon },
    { value: 'auto', label: 'Automatisch', icon: Monitor }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-5 w-5" />
            Optionen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sprache */}
          <Card className="bg-gray-700/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg">🌍 Sprache</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="language">Sprache auswählen</Label>
                <Select value={options.language} onValueChange={(value) => updateOption('language', value)}>
                  <SelectTrigger className="bg-gray-600 border-gray-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code} className="text-white">
                        <span className="mr-2">{lang.flag}</span>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Audio */}
          <Card className="bg-gray-700/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {options.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                Audio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-enabled">Soundeffekte</Label>
                <Switch
                  id="sound-enabled"
                  checked={options.soundEnabled}
                  onCheckedChange={(checked) => updateOption('soundEnabled', checked)}
                />
              </div>

              {options.soundEnabled && (
                <div className="space-y-2">
                  <Label>Sound-Lautstärke: {options.soundVolume}%</Label>
                  <Slider
                    value={[options.soundVolume]}
                    onValueChange={([value]) => updateOption('soundVolume', value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="music-enabled">Hintergrundmusik</Label>
                <Switch
                  id="music-enabled"
                  checked={options.musicEnabled}
                  onCheckedChange={(checked) => updateOption('musicEnabled', checked)}
                />
              </div>

              {options.musicEnabled && (
                <div className="space-y-2">
                  <Label>Musik-Lautstärke: {options.musicVolume}%</Label>
                  <Slider
                    value={[options.musicVolume]}
                    onValueChange={([value]) => updateOption('musicVolume', value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Darstellung */}
          <Card className="bg-gray-700/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-lg">🎨 Darstellung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Design</Label>
                <Select value={options.theme} onValueChange={(value: 'light' | 'dark' | 'auto') => updateOption('theme', value)}>
                  <SelectTrigger className="bg-gray-600 border-gray-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {themes.map((theme) => {
                      const Icon = theme.icon;
                      return (
                        <SelectItem key={theme.value} value={theme.value} className="text-white">
                          <Icon className="h-4 w-4 mr-2 inline" />
                          {theme.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="fullscreen">Vollbildmodus</Label>
                <Switch
                  id="fullscreen"
                  checked={options.fullscreen}
                  onCheckedChange={(checked) => updateOption('fullscreen', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Aktionen */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="border-gray-600 text-gray-300 hover:bg-gray-600"
            >
              Standard wiederherstellen
            </Button>
            <Button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-700">
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 