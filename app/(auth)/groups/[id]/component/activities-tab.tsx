"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatTimeAgo } from "@/lib/utils";
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronDown,
  LogIn,
  LogOut,
  UserX,
  Users
} from "lucide-react";

interface ActivitiesTabProps {
  activities: any[];
  activityLimit: number;
  activityNames: Record<string, string>;
  onShowMore: () => void;
}

function getActivityIcon(action: string) {
  switch (action) {
    case "join":    return <LogIn size={16} className="text-green-500" />;
    case "leave":   return <LogOut size={16} className="text-zinc-400" />;
    case "kick":    return <UserX size={16} className="text-red-500" />;
    case "promote": return <ArrowBigUp size={16} className="text-blue-500" />;
    case "demote":  return <ArrowBigDown size={16} className="text-orange-500" />;
    default:        return <Users size={16} className="text-zinc-400" />;
  }
}

function getActivityMessage(
  activity: any,
  getName: (id: string) => string
): React.ReactNode {
  const user = getName(activity.user_id);
  const actor = getName(activity.actor_id);
  const bold = (name: string) => (
    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{name}</span>
  );

  switch (activity.action) {
    case "join":    return <>{bold(user)} joined the group</>;
    case "leave":   return <>{bold(user)} left the group</>;
    case "kick":    return <>{bold(actor)} kicked out {bold(user)}</>;
    case "promote": return <>{bold(actor)} promoted {bold(user)} to Admin</>;
    case "demote":  return <>{bold(actor)} demoted {bold(user)} to Member</>;
    default:        return <>{bold(user)} performed an action</>;
  }
}

export function ActivitiesTab({
  activities,
  activityLimit,
  activityNames,
  onShowMore
}: ActivitiesTabProps) {
  const getName = (id: string) => activityNames[id] || "Unknown User";

  const sorted = [...activities].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (sorted.length === 0) {
    return (
      <Card className="rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CardContent className="text-muted-foreground p-6 text-center text-sm">
          No recent activities yet.
        </CardContent>
      </Card>
    );
  }

  const visible = sorted.slice(0, activityLimit);
  const hasMore = activityLimit < sorted.length;

  return (
    <div className="space-y-2">
      {visible.map((activity, idx) => (
        <Card
          key={idx}
          className="rounded-xl border border-zinc-200 py-0 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <CardContent className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              {getActivityIcon(activity.action)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {getActivityMessage(activity, getName)}
              </p>
            </div>
            <span className="shrink-0 text-[10px] font-medium text-zinc-400">
              {formatTimeAgo(activity.created_at)}
            </span>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowMore}
            className="text-xs font-semibold text-zinc-500 hover:text-orange-600">
            Show More
            <ChevronDown size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
