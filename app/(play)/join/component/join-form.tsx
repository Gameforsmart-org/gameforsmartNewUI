"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrScanner } from "./qr-scanner";

interface JoinFormProps {
  gamePin: string;
  loading: boolean;
  scanning: boolean;
  onPinChange: (pin: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStartScan: () => void;
  onStopScan: () => void;
}

export function JoinForm({
  gamePin,
  loading,
  scanning,
  onPinChange,
  onSubmit,
  onStartScan,
  onStopScan
}: JoinFormProps) {
  return (
    <Card className="card mx-auto w-96">
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-col items-center justify-center gap-2">
            <Image
              src="/gameforsmartlogo.png"
              width={200}
              height={40}
              alt="gameforsmart"
              className="opacity-90 dark:opacity-100"
              unoptimized
            />
            <p className="text-muted-foreground text-sm dark:text-zinc-400">
              Enter the code to join the fun!
            </p>
          </div>

          <Input
            value={gamePin}
            onChange={(e) => onPinChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            required
            className="input h-14 bg-gray-50 text-center text-sm font-bold tracking-[0.2em] text-orange-900 transition-colors sm:text-3xl"
          />

          <div className="flex w-full flex-col items-center gap-3">
            <Button
              type="submit"
              className="button-orange h-12 w-full"
              disabled={loading || !gamePin}>
              {loading ? "Joining..." : "Join Game"}
            </Button>

            {/* Divider */}
            <div className="relative flex w-full items-center justify-center py-2">
              <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
              <span className="text-muted-foreground px-4 text-xs font-semibold uppercase dark:text-zinc-500">
                OR
              </span>
              <div className="w-full border-t border-gray-200 dark:border-zinc-800" />
            </div>

            <QrScanner scanning={scanning} onStart={onStartScan} onStop={onStopScan} />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
