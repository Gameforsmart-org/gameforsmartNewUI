"use client";

import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerProps {
  scanning: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function QrScanner({ scanning, onStart, onStop }: QrScannerProps) {
  if (!scanning) {
    return (
      <Button
        type="button"
        variant="outline"
        className="button-orange-outline h-12 w-full"
        onClick={onStart}>
        <Camera className="mr-2 size-5" /> Scan QR Code
      </Button>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div
        id="qr-reader-container"
        className="border-primary/20 dark:border-primary/40 aspect-square w-full overflow-hidden rounded-lg border-2 bg-black"
      />
      <Button type="button" variant="destructive" className="w-full" onClick={onStop}>
        <X className="mr-2" /> Stop Scanning
      </Button>
    </div>
  );
}
