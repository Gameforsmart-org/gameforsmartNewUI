"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Flag, Timer, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GameCountdown } from "@/app/(play)/component/game-timer";
import { usePlayerPlay } from "../hooks/use-player-play";

interface PlayProps { sessionId: string; }

export default function Play({ sessionId }: PlayProps) {
  const {
    session, questions, currentQuestion, currentIndex,
    loading, showLoader, showCountdown, countdownLeft,
    timeLeft, formatTime,
    responses, flagged, submitDialogOpen, setSubmitDialogOpen,
    answeredCount, allAnswered, progressPct, isLastQuestion,
    handleNext, handlePrevious, handleJumpTo, handleFlag, handleAnswer, handleSubmit
  } = usePlayerPlay(sessionId);

  return (
    <div className="base-background min-h-screen w-full transition-colors duration-300">
      <GameCountdown countdownLeft={countdownLeft} showCountdown={showCountdown} title="Get Ready!" />

      {loading || showCountdown ? (
        <div className="flex min-h-screen items-center justify-center">
          {showLoader && !showCountdown && <Loader2 className="h-8 w-8 animate-spin text-gray-400" />}
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex h-auto w-full items-center gap-4 px-4">
            <div className="flex w-full flex-col items-center justify-center gap-2 py-2">
              <div className="flex w-full items-center justify-between text-sm font-medium text-orange-600">
                <p>Progress</p>
                <p>{answeredCount}/{questions.length}</p>
              </div>
              <Progress indicatorColor="bg-orange-500" value={progressPct} className="h-2 w-full" />
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-orange-100 px-4 py-2 font-semibold text-orange-700 shadow-sm">
              <Timer className="h-4 w-4" />
              <span>
                {!session?.started_at && session?.status !== "finished" ? "--:--" : formatTime(timeLeft)}
              </span>
            </div>
          </div>

          {/* Grid */}
          <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
            {/* Left: Question + Answers */}
            <div className="order-1 flex flex-col space-y-4 overflow-y-auto p-4">
              {currentQuestion && (
                <>
                  <Card className="border-none py-4 shadow-sm">
                    <CardContent className="rounded-lg px-4">
                      <div className="flex items-center justify-between">
                        <h1 className="mb-2 text-xl font-semibold text-orange-900">
                          Question {currentIndex + 1}
                        </h1>
                        <Button
                          variant={flagged.has(currentQuestion.id) ? "secondary" : "outline"}
                          className={flagged.has(currentQuestion.id)
                            ? "border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-200" : ""}
                          onClick={handleFlag}>
                          <Flag className={cn("mr-2 h-4 w-4", flagged.has(currentQuestion.id) && "fill-current")} />
                          {flagged.has(currentQuestion.id) ? "Flagged" : "Flag"}
                        </Button>
                      </div>
                      <div className="mt-4 text-lg">{currentQuestion.question}</div>
                      {currentQuestion.image && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
                          <img src={currentQuestion.image} alt={`Q${currentIndex + 1}`} className="w-full max-h-60 object-contain bg-slate-50" />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Answer options */}
                  <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {(() => {
                      let opts: any[] = [];
                      if (Array.isArray(currentQuestion.answers) && currentQuestion.answers.length > 0) {
                        opts = currentQuestion.answers.map((a) => ({ id: a.id, text: a.answer, key: a.id, image: a.image }));
                      } else if (Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0) {
                        opts = currentQuestion.options;
                      } else {
                        ["a","b","c","d","e"].forEach((k) => {
                          const t = currentQuestion[`option_${k}`];
                          if (t) opts.push({ id: k, text: t, key: k });
                        });
                      }
                      return opts.map((item, idx) => (
                        <div key={item.id} onClick={() => handleAnswer(item.id)}
                          className={cn(
                            "cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md active:scale-[0.98]",
                            responses[currentQuestion.id] === item.id
                              ? "border-orange-500 bg-orange-50/50 ring-2 ring-orange-200"
                              : "border-slate-100 bg-white hover:border-orange-200 hover:bg-orange-50"
                          )}>
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                              responses[currentQuestion.id] === item.id
                                ? "border-orange-500 bg-orange-500 text-white"
                                : "border-orange-200 bg-orange-50 text-orange-500"
                            )}>
                              {String.fromCharCode(65 + idx)}
                            </div>
                            <div className="flex-1">
                              <div className="pt-1">{item.text}</div>
                              {item.image && (
                                <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
                                  <img src={item.image} alt={`Ans ${String.fromCharCode(65 + idx)}`} className="w-full max-h-32 object-contain bg-slate-50" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </section>
                </>
              )}

              {/* Navigation */}
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={handlePrevious} className="button-orange-outline" disabled={currentIndex === 0}>
                  Previous
                </Button>
                {isLastQuestion && allAnswered ? (
                  <Button className="button-green" onClick={() => setSubmitDialogOpen(true)}>Submit Quiz</Button>
                ) : (
                  <Button variant="outline" onClick={handleNext} className="button-orange-outline">
                    {isLastQuestion ? "First Question" : "Next"}
                  </Button>
                )}

                <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                  <DialogContent className="dialog">
                    <DialogHeader>
                      <DialogTitle className="text-orange-900">Submit Quiz?</DialogTitle>
                      <DialogDescription>
                        You have answered all {questions.length} questions. Are you sure?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Review</Button></DialogClose>
                      <Button onClick={handleSubmit} className="button-green">Yes, Submit</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Right: Question nav */}
            <aside className="order-2 p-4 lg:order-2 lg:pl-0">
              <Card className="border-none py-4 shadow-sm">
                <CardContent className="sticky bottom-0 px-4 lg:top-0">
                  <p className="mb-3 font-semibold text-orange-700">Question Navigation</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-2 lg:grid-cols-5">
                    {questions.map((q, i) => {
                      const isCurrent  = currentIndex === i;
                      const isAnswered = !!responses[q.id];
                      const isFlagged  = flagged.has(q.id);
                      const bg = isCurrent ? "bg-orange-100 border-orange-500 text-orange-700 font-bold ring-2 ring-orange-200"
                        : isFlagged  ? "bg-amber-100 border-amber-500 text-amber-700"
                        : isAnswered ? "bg-green-100 border-green-500 text-green-700"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700";
                      return (
                        <button key={q.id} onClick={() => handleJumpTo(i)}
                          className={cn("flex aspect-square cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition relative", bg)}>
                          {i + 1}
                          {isFlagged && <div className="absolute top-0 right-0 -mt-1 -mr-1 h-2 w-2 rounded-full bg-amber-500" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                    {[
                      { color: "border-orange-500 bg-orange-100", label: "Current Question" },
                      { color: "border-green-500 bg-green-100",   label: "Answered" },
                      { color: "border-amber-500 bg-amber-100",   label: "Flagged" },
                      { color: "border-slate-200 bg-white",       label: "Not Answered" }
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-3 text-sm">
                        <div className={`size-4 rounded-sm border ${color}`} />
                        <span className="text-slate-600">{label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
