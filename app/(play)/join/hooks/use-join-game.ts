"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import {
  findGameSession,
  joinSession,
  resolveProfile
} from "../../services/play.service";
import { isRealtimeDbConfigured, getParticipantsRT } from "@/lib/supabase-realtime";
import { supabase } from "@/lib/supabase";

export function useJoinGame(initialPin?: string) {
  const router = useRouter();
  const { user, profileId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();

  const [gamePin,        setGamePin]        = useState(initialPin || "");
  const [loading,        setLoading]        = useState(false);
  const [scanning,       setScanning]       = useState(false);
  const [error,          setError]          = useState("");
  const [shouldAutoJoin, setShouldAutoJoin] = useState(false);
  const [isReadyToJoin,  setIsReadyToJoin]  = useState(false);
  const scannerRef = useRef<any>(null);

  // PIN recovery
  useEffect(() => {
    const pinFromUrl     = searchParams.get("pin");
    const pinFromStorage = localStorage.getItem("pin");
    const oauthPin       = localStorage.getItem("oauth_game_pin");

    let targetPin = pinFromUrl || initialPin || oauthPin || pinFromStorage || "";

    if (oauthPin) localStorage.removeItem("oauth_game_pin");

    if (targetPin) {
      localStorage.setItem("pin", targetPin);
      setGamePin(targetPin);
      setShouldAutoJoin(true);
    }
  }, [searchParams, initialPin]);

  // Min delay to prevent flickering
  useEffect(() => {
    if (!shouldAutoJoin) return;
    setIsReadyToJoin(false);
    const timer = setTimeout(() => setIsReadyToJoin(true), 800);
    return () => clearTimeout(timer);
  }, [shouldAutoJoin]);

  // Reactive auto join
  useEffect(() => {
    if (shouldAutoJoin && isReadyToJoin && !authLoading && gamePin && user) {
      joinGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldAutoJoin, isReadyToJoin, authLoading, user, gamePin]);

  // Cleanup scanner on unmount
  useEffect(() => () => { stopScanning(); }, []);

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {}
    }
    setScanning(false);
  };

  const startScanning = async () => {
    try {
      setError("");
      setScanning(true);
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText: string) => handleQRCodeDetected(decodedText),
        () => {}
      );
    } catch {
      setScanning(false);
      toast.error("Cannot access the camera");
    }
  };

  const handleQRCodeDetected = (data: string) => {
    stopScanning();
    let pin = "";
    try {
      const url = new URL(data);
      pin = url.searchParams.get("pin") || url.pathname.match(/\/join\/(\d{6})/)?.[1] || "";
    } catch {
      pin = data.match(/^\d{6}$/)?.[0] || "";
    }

    if (pin) {
      setGamePin(pin);
      setShouldAutoJoin(true);
      localStorage.setItem("pin", pin);
      toast.success("QR Code detected: " + pin);
    } else {
      toast.error("QR code not valid");
    }
  };

  const joinGame = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!gamePin || authLoading) return;

    setLoading(true);
    setError("");

    try {
      if (!user) {
        router.push(`/login?redirect=/join/${gamePin}`);
        return;
      }

      const { profileId: pid, username } = await resolveProfile(user.id, profileId);
      const session = await findGameSession(gamePin);

      if (session.status === "finished") {
        toast.error("Session finished");
        setShouldAutoJoin(false);
        return;
      }

      // Check if already in session
      let existing = null;
      if (isRealtimeDbConfigured) {
        const partsRT = await getParticipantsRT(session.id);
        existing = partsRT.find((p) => p.user_id === pid);
      } else {
        existing = (session.participants || []).find((p: any) => p.user_id === pid);
      }

      if (existing) {
        localStorage.removeItem("pin");
        localStorage.removeItem("oauth_game_pin");
        router.push(`/player/${session.id}/room`);
        return;
      }

      if (session.status === "active" && !session.allow_join_after_start) {
        toast.error("The session has started and is not accepting new participants");
        setShouldAutoJoin(false);
        return;
      }

      await joinSession(session.id, pid, username || user.email?.split("@")[0] || "Player");

      if (pid) {
        localStorage.setItem(`game_participant_${session.id}`, pid);
        localStorage.setItem("current_game_session", session.id);
        localStorage.setItem("current_profile_id", pid);
      }

      localStorage.removeItem("pin");
      localStorage.removeItem("oauth_game_pin");
      router.push(`/player/${session.id}/room`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join session");
    } finally {
      setLoading(false);
    }
  };

  return {
    gamePin, setGamePin,
    loading, scanning, error,
    shouldAutoJoin, authLoading,
    startScanning, stopScanning,
    joinGame
  };
}
