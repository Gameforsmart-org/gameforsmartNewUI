"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControl } from "@/components/pagination-control";
import { useAuth } from "@/contexts/auth-context";
import { useGroupActivities } from "@/hooks/useGroupActivities";
import { Calendar, EyeOff, Lock, Users } from "lucide-react";
import {
  joinGroup,
  requestJoinGroup,
  cancelJoinRequest
} from "../services/groups.service";
import type { GroupData } from "../types";

const ITEMS_PER_PAGE = 12;

interface GroupCardProps {
  groups: GroupData[];
  isMyGroup?: boolean;
}

export default function GroupCard({ groups, isMyGroup = false }: GroupCardProps) {
  const { profileId } = useAuth();
  const router = useRouter();
  const { logActivity } = useGroupActivities();

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, "pending" | "none">>({});
  const [currentPage, setCurrentPage] = useState(1);

  const handleJoin = async (group: GroupData) => {
    if (!profileId) return toast.error("You must be logged in to join");

    setLoadingId(group.id);
    try {
      await joinGroup(group.id, profileId);
      await logActivity(group.id, profileId, profileId, "join");
      toast.success("Successfully joined the group!");
      router.refresh();
    } catch (error: any) {
      if (error.message === "already_member") {
        toast.info("You are already a member");
      } else {
        toast.error(error.message || "Failed to join group");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleRequestJoin = async (group: GroupData) => {
    if (!profileId) return toast.error("You must be logged in to request join");

    setLoadingId(group.id);
    try {
      await requestJoinGroup(group.id, profileId);
      setOptimisticStatus((prev) => ({ ...prev, [group.id]: "pending" }));
      toast.success("Join request sent!");
      router.refresh();
    } catch (error: any) {
      if (error.message === "already_requested") {
        toast.info("You have already sent a request");
      } else {
        toast.error(error.message || "Failed to send request");
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancelRequest = async (group: GroupData) => {
    if (!profileId) return;

    setLoadingId(group.id);
    try {
      await cancelJoinRequest(group.id, profileId);
      setOptimisticStatus((prev) => ({ ...prev, [group.id]: "none" }));
      toast.success("Request cancelled");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel request");
    } finally {
      setLoadingId(null);
    }
  };

  if (!groups || groups.length === 0) {
    return <div className="py-10 text-center text-gray-500">No groups found</div>;
  }

  const totalItems = groups.length;
  const currentGroups = groups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {currentGroups.map((group) => {
          const memberCount = Array.isArray(group.members) ? group.members.length : 0;
          const status = group.settings?.status || "public";
          const adminsApproval = group.settings?.admins_approval || false;

          const isPending = optimisticStatus[group.id]
            ? optimisticStatus[group.id] === "pending"
            : Array.isArray(group.join_requests) &&
              group.join_requests.some(
                (r: any) => r.user_id === profileId && r.status === "pending"
              );

          const createdDate = group.created_at
            ? new Date(group.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })
            : "-";

          return (
            <Card key={group.id} className="group border-card-vertical rounded-2xl pt-0">
              <div className="horizontal-line" />
              <CardContent className="space-y-5 px-6">
                {/* Category & Status Icon */}
                <div className="flex items-center justify-between">
                  <Badge className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-600 hover:bg-orange-200 dark:bg-orange-900 dark:hover:bg-orange-800">
                    {group.category || "General"}
                  </Badge>
                  <div className="flex items-center gap-2 text-gray-500">
                    {status === "private" ? (
                      <Lock size={16} />
                    ) : status === "secret" ? (
                      <EyeOff size={16} />
                    ) : null}
                  </div>
                </div>

                {/* Title */}
                <h3 className="line-clamp-1 text-lg font-semibold" title={group.name}>
                  {group.name}
                </h3>

                {/* Creator */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-lime-400">
                    <AvatarImage src={group.creator?.avatar_url || ""} />
                    <AvatarFallback className="bg-lime-400 text-white">
                      {(
                        group.creator?.nickname?.[0] ||
                        group.creator?.fullname?.[0] ||
                        group.creator?.username?.[0] ||
                        "?"
                      ).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="truncate text-sm font-medium">
                      {[group.creator?.nickname, group.creator?.fullname]
                        .filter(Boolean)
                        .join(" - ") || ""}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {[
                        group.creator?.username ? `@${group.creator.username}` : null,
                        [group.creator?.state?.name, group.creator?.city?.name]
                          .filter(Boolean)
                          .join(", ")
                      ]
                        .filter(Boolean)
                        .join(" - ") || ""}
                    </p>
                  </div>
                </div>

                {/* Footer: Stats & Action */}
                <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-2 dark:border-zinc-800">
                  <div className="text-muted-foreground flex flex-col gap-1 text-[11px] sm:text-xs">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-400" />
                      <span>{memberCount.toLocaleString()} members</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{createdDate}</span>
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {isMyGroup ? (
                      <Button
                        onClick={() => router.push(`/groups/${group.id}`)}
                        variant="secondary"
                        className="button-orange-outline h-9 rounded-xl px-4 text-sm">
                        Detail
                      </Button>
                    ) : adminsApproval ? (
                      isPending ? (
                        <Button
                          variant="outline"
                          className="h-9 rounded-md border-red-200 px-4 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:bg-red-950 dark:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-500"
                          onClick={() => handleCancelRequest(group)}
                          disabled={loadingId === group.id}>
                          {loadingId === group.id ? "..." : "Cancel"}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="h-9 rounded-md px-4 text-xs"
                          onClick={() => handleRequestJoin(group)}
                          disabled={loadingId === group.id}>
                          {loadingId === group.id ? "..." : "Request"}
                        </Button>
                      )
                    ) : (
                      <Button
                        className="button-orange h-9 px-4 text-sm"
                        onClick={() => handleJoin(group)}
                        disabled={loadingId === group.id}>
                        {loadingId === group.id ? "..." : "Join"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {totalItems > ITEMS_PER_PAGE && (
        <div className="flex justify-center pt-4">
          <PaginationControl
            totalItems={totalItems}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}
    </div>
  );
}
