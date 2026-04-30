"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CircleQuestionMark, Copy, LogOut, Play, Timer, User, Users, UserX } from "lucide-react";
import { usePlayerRoom } from "../hooks/use-player-room";

interface WaitingRoomProps { sessionId: string; }

export default function WaitingRoom({ sessionId }: WaitingRoomProps) {
  const {
    participantId, gameSession, quizData, participants,
    loading, leaveDialogOpen, setLeaveDialogOpen,
    joinLink, handleLeaveGame, copyToClipboard
  } = usePlayerRoom(sessionId);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!gameSession || !quizData) return null;

  return (
    <div className="base-background relative h-screen overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px]">
        {/* Left: Participants */}
        <div className="order-2 p-4 lg:order-1">
          <Card className="min-h-96 gap-0 border-0 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <CardContent>
              <div className="flex w-full items-center justify-between pb-6">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                  <Users className="text-orange-500" />
                  <p className="text-2xl font-bold">Players</p>
                </div>
                <Button variant="outline" onClick={() => setLeaveDialogOpen(true)}
                  className="border-zinc-200 text-zinc-600 hover:bg-orange-50 hover:text-orange-600 dark:border-zinc-700">
                  <LogOut className="mr-2 size-4" /> Leave
                </Button>
              </div>

              {participants.length === 0 ? (
                <div className="text-muted-foreground flex h-40 flex-col items-center justify-center">
                  <Users className="mb-2 size-12 opacity-10" />
                  <p>Waiting for players to join...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {participants.map((player) => (
                    <Card key={player.id} className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-400 to-yellow-400 py-0 shadow-md">
                      <CardContent className="flex flex-col items-center p-3">
                        <Avatar className="mb-2 size-12 border-2 border-white shadow-sm">
                          <AvatarImage src={player.avatar_url || ""} />
                          <AvatarFallback className="bg-orange-100 text-xs font-bold text-orange-600">
                            {player.nickname.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="w-full truncate text-center text-sm font-medium text-zinc-700" title={player.nickname}>
                          {player.nickname}
                        </p>
                        {player.id === participantId && (
                          <span className="text-[10px] font-black tracking-wider text-orange-600 uppercase">(YOU)</span>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Info panel */}
        <div className="order-1 p-4 pb-0 lg:pb-4 lg:pl-0">
          <Card className="border-0 bg-white shadow-sm dark:bg-zinc-900">
            <CardContent className="sticky top-0 flex h-full flex-col gap-6">
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-black tracking-tight text-orange-900 dark:text-orange-100">{quizData.title}</p>
                <p className="text-sm text-orange-500">{quizData.description || "No description"}</p>
              </div>

              <Card className="border-orange-100 bg-orange-50/50 dark:border-zinc-800 dark:bg-zinc-950 py-0">
                <CardContent className="p-0">
                  <div className="flex items-center justify-evenly py-4">
                    {[
                      { icon: CircleQuestionMark, value: gameSession.question_limit || quizData.questions?.length || 0, label: "QUESTIONS", color: "text-yellow-500" },
                      { icon: Timer, value: `${gameSession.total_time_minutes}m`, label: "TIME", color: "text-orange-500" },
                      { icon: User, value: participants.length, label: "PLAYERS", color: "text-green-500" }
                    ].map(({ icon: Icon, value, label, color }) => (
                      <div key={label} className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          <Icon className={`size-5 ${color}`} /><span>{value}</span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-orange-900 uppercase">{label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Waiting animation */}
              <div className="flex flex-col items-center justify-center py-4">
                <div className="mb-2 flex justify-center md:mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-orange-600 to-yellow-500 opacity-20 blur-xl" />
                    <div className="relative rounded-full border-2 border-white bg-gradient-to-br from-orange-50 to-yellow-50 p-4 shadow-xl md:border-4 md:p-6 dark:border-zinc-800">
                      <Play className="h-8 w-8 text-orange-600 md:h-12 md:w-12" />
                    </div>
                  </div>
                </div>
                <h2 className="bg-orange-600 bg-clip-text text-xl font-black text-transparent md:text-2xl">
                  Wait For Host To Start
                </h2>
              </div>

              {/* PIN + link */}
              <div className="space-y-2 text-center">
                <p className="text-xs font-bold tracking-widest text-zinc-500 uppercase">Game PIN</p>
                <div className="flex cursor-pointer items-center justify-center gap-2 text-6xl font-black text-orange-500"
                  onClick={() => copyToClipboard(gameSession.game_pin)}>
                  {gameSession.game_pin}
                </div>
              </div>

              <div className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-100 bg-orange-50/50 p-3 text-sm font-medium text-orange-800 select-all"
                onClick={() => copyToClipboard(joinLink)}>
                <span className="max-w-[240px] truncate">{joinLink}</span>
                <Copy size={14} className="text-orange-500" />
              </div>

              <div className="mt-auto grid grid-cols-2 gap-3">
                <Button variant="ghost" className="border border-dashed border-green-200 text-xs text-green-700 hover:bg-green-50">WhatsApp</Button>
                <Button variant="ghost" className="border border-dashed border-blue-200 text-xs text-blue-700 hover:bg-blue-50">Telegram</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leave Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] dark:border-zinc-800 dark:bg-zinc-950">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600"><UserX size={20} /> Leave Room</DialogTitle>
            <DialogDescription className="dark:text-zinc-400">
              Are you sure you want to leave? You can rejoin later using the PIN.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={handleLeaveGame}>Leave Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
