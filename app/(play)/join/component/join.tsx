"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JoinForm } from "./join-form";
import { JoinLoadingScreen } from "./join-loading-screen";
import { useJoinGame } from "../hooks/use-join-game";
import type { JoinProps } from "../../types";

function JoinGameContent({ initialPin }: JoinProps) {
  const router = useRouter();
  const {
    gamePin, setGamePin,
    loading, scanning, shouldAutoJoin, authLoading,
    startScanning, stopScanning,
    joinGame
  } = useJoinGame(initialPin);

  if (shouldAutoJoin && !authLoading) {
    return <JoinLoadingScreen />;
  }

  return (
    <div className="base-background relative flex h-screen flex-col items-center justify-center">
      <JoinForm
        gamePin={gamePin}
        loading={loading}
        scanning={scanning}
        onPinChange={setGamePin}
        onSubmit={joinGame}
        onStartScan={startScanning}
        onStopScan={stopScanning}
      />

      {!scanning && (
        <div className="absolute bottom-8">
          <Button
            onClick={() => router.push("/dashboard")}
            variant="ghost"
            className="hover:bg-orange/50 rounded-full text-orange-800 hover:text-orange-900 dark:text-orange-400 dark:hover:bg-zinc-800/50">
            Back to Dashboard <ChevronRight className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function Join({ initialPin }: JoinProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinGameContent initialPin={initialPin} />
    </Suspense>
  );
}
