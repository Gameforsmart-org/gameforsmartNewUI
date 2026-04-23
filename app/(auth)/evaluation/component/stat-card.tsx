"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle, HelpCircle, Target, TrendingUp } from "lucide-react";

type IconKey = "play" | "target" | "help" | "trend";

const ICON_MAP: Record<IconKey, React.ElementType> = {
  play:   PlayCircle,
  target: Target,
  help:   HelpCircle,
  trend:  TrendingUp
};

interface StatCardProps {
  title: string;
  value: string;
  icon: IconKey;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  const Icon = ICON_MAP[icon];

  return (
    <Card className="rounded-2xl py-0 shadow-sm">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm uppercase">{title}</p>
          {Icon && <Icon className="text-primary size-5" />}
        </div>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
