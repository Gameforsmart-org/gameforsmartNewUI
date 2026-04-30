"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CircleQuestionMark, Timer, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GameTimer, GameTimerProgress, GameCountdown } from "@/app/(play)/component/game-timer";
import { useHostPlay } from "../hooks/use-host-play";

interface PlayProps { sessionId: string; }

export default function Play({ sessionId }: PlayProps) {
  const {
    session, participants, loading, showLoader,
    showCountdown, countdownLeft,
    handleEndGame, handleTimeUp
  } = useHostPlay(sessionId);

  return (
    <div className="base-background min-h-screen w-full transition-colors duration-300 dark:bg-zinc-950">
      <GameCountdown countdownLeft={countdownLeft} showCountdown={showCountdown} title="Game Starting..." />

      {loading || showCountdown ? (
        <div className="flex min-h-screen items-center justify-center">
          {showLoader && !showCountdown && <Loader2 className="h-8 w-8 animate-spin text-orange-500" />}
        </div>
      ) : (
        <>
          <div className="fixed top-[3.6rem] right-0 left-0 z-50 w-full backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
            <div className="absolute right-0 -bottom-1.5 left-0">
              <GameTimerProgress startedAt={session!.started_at} totalTimeMinutes={session!.total_time_minutes} status={session!.status} onTimeUp={handleTimeUp} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1fr_360px]">
            <div className="lg:fixed lg:top-16 lg:right-2 lg:order-1 max-h-fit">
              <Card>
                <CardContent className="flex flex-col items-center space-y-4">
                  <GameTimer startedAt={session!.started_at} totalTimeMinutes={session!.total_time_minutes} status={session!.status} onTimeUp={handleTimeUp} />

                  <div className="flex w-full items-center justify-center gap-8 py-2">
                    {[
                      { icon: CircleQuestionMark, value: session!.question_limit, label: "QUESTIONS", color: "text-yellow-500" },
                      { icon: Timer, value: `${session!.total_time_minutes}m`, label: "TIME", color: "text-orange-500" },
                      { icon: User, value: participants.length, label: "PLAYERS", color: "text-green-500" }
                    ].map(({ icon: Icon, value, label, color }) => (
                      <div key={label} className="flex flex-col items-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-orange-900 dark:text-zinc-100">
                          <Icon className={`size-5 ${color}`} /><span>{value}</span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-orange-600/60 uppercase">{label}</p>
                      </div>
                    ))}
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">End Session</Button>
                    </DialogTrigger>
                    <DialogContent className="dark:border-zinc-800 dark:bg-zinc-900">
                      <DialogHeader>
                        <DialogTitle className="dark:text-zinc-100">End Session</DialogTitle>
                        <DialogDescription className="dark:text-zinc-400">Are you sure you want to end this session?</DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <DialogClose asChild><Button variant="destructive" onClick={handleEndGame}>End Session</Button></DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            <div className="sm:order-2">
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {participants.map((p) => {
                    const answered = p.responses?.length || 0;
                    const max = parseInt(session!.question_limit) || session!.current_questions?.length || 20;
                    const percent = Math.min(100, Math.round((answered / max) * 100));
                    return (
                      <motion.div key={p.id} layout initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
                        <Card className="h-full border-orange-100 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                          <CardContent className="px-4">
                            <div className="flex items-center justify-between gap-3">
                              <Avatar className="border-2 border-orange-100 dark:border-zinc-700">
                                <AvatarImage src={p.avatar_url} alt={p.nickname} />
                                <AvatarFallback className="bg-orange-100 font-bold text-orange-600">{p.nickname.substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <p className="flex-1 overflow-hidden font-bold text-ellipsis text-orange-950 dark:text-zinc-100">{p.nickname}</p>
                              <p className="text-xs font-black text-green-600">{percent}%</p>
                            </div>
                            <div className="mt-4 flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-orange-800/50 uppercase">
                                <p>Progress</p><p>{answered}/{max}</p>
                              </div>
                              <Progress value={percent} className="h-2 bg-orange-500" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {participants.length === 0 && (
            <div className="py-20 text-center">
              <p className="font-medium text-orange-300 dark:text-zinc-600">Waiting for participants to join...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
