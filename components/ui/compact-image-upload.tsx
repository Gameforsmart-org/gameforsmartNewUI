"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "./button";
import { Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImageFile, createCompressedPreview } from "@/lib/image-compression";

interface CompactImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  className?: string;
}

/**
 * CompactImageUpload – deferred upload mode.
 * Stores a data:URL preview locally. The actual upload to Supabase
 * happens when the user presses Save (handled by the parent hook).
 */
export default function CompactImageUpload({
  imageUrl,
  onImageChange,
  className,
}: CompactImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [uniqueId] = useState(() => `image-upload-${Math.random().toString(36).slice(2)}`);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    try {
      // Create a data URL preview — no upload yet
      const dataUrl = await createCompressedPreview(file, {
        maxWidth: 800,
        maxHeight: 600,
        quality: 0.85,
      });
      onImageChange(dataUrl);
    } catch (processingError) {
      console.error("Error processing image:", processingError);
      setError("Failed to process image. Please try again.");
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setError(null);
  };

  const isDataUrl = imageUrl?.startsWith("data:");

  return (
    <div className={cn("relative", className)}>
      {imageUrl ? (
        <div className="relative group">
          <div className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            {/* Use <img> for data URLs to avoid next/image hostname restriction */}
            {isDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="Preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src={imageUrl}
                alt="Answer image"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveImage}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
            id={uniqueId}
          />
          <label
            htmlFor={uniqueId}
            className={cn(
              "block w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors",
              "flex items-center justify-center bg-slate-50 hover:bg-slate-100"
            )}
          >
            <div className="flex items-center space-x-2 text-slate-500">
              <Upload className="w-3 h-3" />
              <span className="text-xs">Add Image</span>
            </div>
          </label>
        </div>
      )}

      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}
