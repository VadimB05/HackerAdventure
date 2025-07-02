'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUploadUrl } from '@/lib/utils';
import Image from 'next/image';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ImageUpload({ value, onChange, placeholder = "Bild auswählen", className = "" }: ImageUploadProps) {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verfügbare Bilder laden
  const loadAvailableImages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/upload');
      if (response.ok) {
        const data = await response.json();
        // Alle Bilder sortieren
        const allImages = (data.images || []).sort() as string[];
        setAvailableImages(allImages);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Bilder:', error);
    }
  }, []);

  // Dropdown öffnen und Bilder laden
  const handleDropdownOpen = useCallback((open: boolean) => {
    setShowDropdown(open);
    if (open) {
      loadAvailableImages();
    }
  }, [loadAvailableImages]);

  // Datei hochladen
  const uploadFile = useCallback(async (file: File) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onChange(data.imageUrl);
        toast({
          title: "Erfolg",
          description: "Bild erfolgreich hochgeladen",
        });
        // Bilder-Liste aktualisieren
        loadAvailableImages();
      } else {
        const error = await response.json();
        toast({
          title: "Fehler",
          description: error.error || "Bild konnte nicht hochgeladen werden",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
      toast({
        title: "Fehler",
        description: "Bild konnte nicht hochgeladen werden",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [onChange, toast, loadAvailableImages]);

  // Drag & Drop Handler
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        uploadFile(file);
      } else {
        toast({
          title: "Fehler",
          description: "Nur Bilddateien sind erlaubt",
          variant: "destructive"
        });
      }
    }
  }, [uploadFile, toast]);

  // Datei-Input Handler
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  }, [uploadFile]);

  // Datei-Input öffnen
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Bild löschen
  const handleClearImage = useCallback(() => {
    onChange('');
  }, [onChange]);

    return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        {/* Dropdown für verfügbare Bilder */}
        <Select 
          value={value || "none"} 
          onValueChange={(newValue) => onChange(newValue === "none" ? "" : newValue)}
          onOpenChange={handleDropdownOpen}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein Bild</SelectItem>
            {availableImages.map((image) => (
              <Tooltip key={image}>
                <TooltipTrigger asChild>
                  <SelectItem value={image}>
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      {image}
                    </div>
                  </SelectItem>
                </TooltipTrigger>
                <TooltipContent side="right" className="p-0">
                  <Image 
                    src={getUploadUrl(image)} 
                    alt={image}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-cover rounded border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </TooltipContent>
              </Tooltip>
            ))}
          </SelectContent>
        </Select>

      {/* Drag & Drop Zone */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Aktuelles Bild anzeigen */}
            {value && (
              <div className="relative inline-block">
                <Image 
                  src={getUploadUrl(value)} 
                  alt="Vorschau" 
                  width={128}
                  height={128}
                  className="max-h-32 max-w-full rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0"
                  onClick={handleClearImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Upload-Bereich */}
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ziehe ein Bild hierher oder
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="mt-2"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Wird hochgeladen...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Datei auswählen
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF, WebP bis 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

              {/* Versteckter File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
} 