"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  CircleQuestionMark, Copy, Play, Settings,
  Timer, User, UserPlus, Users, UserX, Check
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { InviteGroup, InviteFriend } from "./dialog-invite";
import { useHostRoom } from "../hooks/use-host-room";

interface WaitingRoomProps { sessionId: string; }

export default function WaitingRoom({ sessionId }: WaitingRoomProps) {
  const router = useRouter();
  const {
    quizData, gameSession, participants, isLoading, isHostJoined,
    participantToKick, setParticipantToKick,
    kickDialogOpen, setKickDialogOpen,
    joinLink,
    handleJoinAsPlayer, handleStartGame, handleKickPlayer,
    copyToClipboard, shareToWhatsApp, shareToTelegram
  } = useHostRoom(sessionId);

  if (isLoading || !quizData) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="base-background relative overflow-y-auto">
      <div className="grid min-h-[90vh] grid-cols-1 lg:grid-cols-[1fr_480px]">

        {/* ── Left: Quiz info + Participants ──────────────────────────────── */}
        <div className="order-2 space-y-4 p-4 lg:order-1">
          {/* Quiz info card */}
          <Card className="card" style={{ "--card-border-w": "1px", "--border-color": "var(--border)" } as React.CSSProperties}>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-orange-950 dark:text-zinc-100">{quizData.title}</p>
                  <p className="text-sm text-orange-800/60 dark:text-zinc-400">{quizData.description || "No description"}</p>
                </div>

                <Card className="border-orange-100 bg-orange-50/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <CardContent className="flex flex-col items-center justify-between gap-4 p-0 sm:flex-row">
                    {/* Creator */}
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 border-2 border-white shadow-sm dark:border-zinc-800">
                        <AvatarImage src={quizData.creator_avatar} />
                        <AvatarFallback className="bg-orange-100 text-orange-600">
                          {quizData.creator_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-orange-500 uppercase">HOSTED BY</p>
                        <p className="text-sm font-semibold text-orange-950 dark:text-zinc-100">{quizData.creator_name}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-8">
                      {[
                        { icon: CircleQuestionMark, value: quizData.question_count, label: "QUESTIONS", color: "text-yellow-500" },
                        { icon: Timer,              value: `${gameSession.total_time_minutes}m`, label: "TIME",      color: "text-orange-500" },
                        { icon: User,               value: participants.length,                  label: "PLAYERS",   color: "text-green-500" }
                      ].map(({ icon: Icon, value, label, color }) => (
                        <div key={label} className="flex flex-col items-center">
                          <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                            <Icon className={`size-5 ${color}`} /><span>{value}</span>
                          </div>
                          <p className="text-[10px] font-bold tracking-wider text-orange-400 uppercase">{label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Participants grid */}
          <Card className="card min-h-[75vh] border-0" style={{ "--card-border-w": "1px", "--border-color": "var(--border)" } as React.CSSProperties}>
            <CardContent>
              {participants.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-orange-200 dark:text-zinc-500">
                  <Users className="mb-2 size-12 opacity-30" />
                  <p className="font-medium text-orange-800/40">Waiting for players to join...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {participants.map((player) => (
                    <Card key={player.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-400 to-yellow-400 shadow-md">
                      <Button
                        variant="ghost" size="icon"
                        className="absolute top-1 right-1 z-10 size-6 text-white hover:bg-white/20"
                        onClick={() => { setParticipantToKick(player); setKickDialogOpen(true); }}>
                        <UserX size={14} />
                      </Button>
                      <CardContent className="flex flex-col items-center px-3">
                        <Avatar className="mb-2 size-14 border-2 border-white shadow-sm">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback className="bg-green-100 text-xs text-green-700">
                            {player.nickname.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="w-full truncate text-center font-semibold text-white" title={player.nickname}>
                          {player.nickname}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Controls ─────────────────────────────────────────────── */}
        <div className="order-1 p-4 pb-0 lg:order-2 lg:pb-4 lg:pl-0">
          <Card className="card sticky top-0 h-fit border-0 py-0 shadow-sm lg:top-4" style={{ "--card-border-w": "1px", "--border-color": "var(--border)" } as React.CSSProperties}>
            <CardContent className="relative flex h-full flex-col gap-6 py-6">
              {/* Settings shortcut */}
              <Button
                variant="ghost"
                className="absolute top-4 right-4 size-10 p-0 text-orange-300 hover:bg-orange-50 hover:text-orange-600"
                onClick={() => router.push(`/host/${sessionId}/settings?from=room`)}
                title="Game Settings">
                <Settings className="!h-7 !w-7" />
              </Button>

              {/* PIN */}
              <div className="space-y-2 text-center">
                <p className="text-sm font-semibold tracking-wider text-orange-400 uppercase">Game PIN</p>
                <div
                  className="flex cursor-pointer items-center justify-center gap-2 text-6xl font-black text-orange-500 hover:opacity-80"
                  onClick={() => copyToClipboard(gameSession.game_pin)}>
                  {gameSession.game_pin}
                  <Copy className="size-6 text-orange-300 opacity-50" />
                </div>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer rounded-2xl border-2 border-orange-50 bg-white p-3 shadow-sm hover:border-orange-400 dark:bg-white">
                      <QRCodeSVG value={joinLink} size={200} level="H" />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="flex flex-col items-center sm:max-w-[620px]">
                    <DialogHeader>
                      <DialogTitle className="text-orange-600">Join Game {gameSession.game_pin}</DialogTitle>
                    </DialogHeader>
                    <div className="aspect-square w-full rounded-xl border border-orange-100 bg-white p-4 shadow-lg">
                      <QRCode value={joinLink} level="H" style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                    </div>
                    <p className="text-xl font-medium text-orange-800">{joinLink}</p>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Join link */}
              <div
                className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-sm font-medium text-orange-800 select-all hover:bg-orange-100"
                onClick={() => copyToClipboard(joinLink)}>
                <span className="max-w-[240px] truncate">{joinLink}</span>
                <Copy size={14} className="text-orange-400" />
              </div>

              {/* Action buttons */}
              <div className="mt-auto space-y-4">
                <div className="flex flex-col gap-3">
                  <Button size="lg" className="button-orange h-14 w-full text-lg font-bold" onClick={handleStartGame}>
                    <Play className="mr-2 fill-current" /> Start Game
                  </Button>
                  <Button
                    variant={isHostJoined ? "secondary" : "outline"} size="lg"
                    className={`w-full font-semibold ${!isHostJoined ? "button-orange-outline" : ""}`}
                    onClick={handleJoinAsPlayer}
                    disabled={isHostJoined || isLoading}>
                    {isHostJoined
                      ? <><Check className="mr-2 text-green-600" /> Joined as Player</>
                      : <><UserPlus className="mr-2" /> Join as Player</>}
                  </Button>
                </div>

                <Separator className="bg-orange-50" />

                <div className="grid grid-cols-2 gap-3">
                  <InviteGroup sessionId={sessionId} />
                  <InviteFriend sessionId={sessionId} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => shareToWhatsApp(joinLink)} variant="ghost"
                    className="border border-dashed border-green-200 text-xs text-green-700 hover:bg-green-50">
                    WhatsApp
                  </Button>
                  <Button onClick={() => shareToTelegram(joinLink)} variant="ghost"
                    className="border border-dashed border-blue-200 text-xs text-blue-700 hover:bg-blue-50">
                    Telegram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kick Dialog */}
      <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <UserX size={20} /> Kick Player
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{participantToKick?.nickname}</strong> from the game?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKickDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleKickPlayer} className="bg-red-600 hover:bg-red-700">Kick</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
