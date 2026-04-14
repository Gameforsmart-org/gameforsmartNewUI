"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Bell, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { handleJoinRequest, getProfilesByIds } from "../../services/groups.service";
import { logGroupActivity } from "@/app/service/group/group.service";

interface DialogApprovalProps {
  groupId: string;
  joinRequests: any[];
}

export default function DialogApproval({ groupId, joinRequests }: DialogApprovalProps) {
  const [open, setOpen] = useState(false);
  const [enhancedRequests, setEnhancedRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const router = useRouter();
  const { profileId } = useAuth();

  useEffect(() => {
    if (open) fetchProfiles();
  }, [open, joinRequests]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const pending = (Array.isArray(joinRequests) ? joinRequests : []).filter(
        (r: any) => r.status === "pending"
      );

      if (pending.length === 0) {
        setEnhancedRequests([]);
        return;
      }

      const userIds = pending.map((r: any) =>
        typeof r.user_id === "string" ? r.user_id : r.user_id?.id
      );

      const profiles = await getProfilesByIds(userIds);

      const merged = pending.map((req: any) => {
        const userId = typeof req.user_id === "string" ? req.user_id : req.user_id?.id;
        return { ...req, profile: profiles.find((p) => p.id === userId) || null };
      });

      setEnhancedRequests(merged);
    } catch {
      console.error("Error fetching profiles for approval");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (request: any, decision: "approved" | "rejected") => {
    const userId = typeof request.user_id === "string" ? request.user_id : request.user_id?.id;
    if (!userId) return;

    setActionLoading(userId);
    try {
      await handleJoinRequest(groupId, userId, decision);

      if (decision === "approved" && profileId) {
        await logGroupActivity(groupId, userId, profileId, "join");
      }

      toast.success(`User ${decision} successfully`);

      // Optimistic removal from list
      setEnhancedRequests((prev) =>
        prev.filter((r) => {
          const rId = typeof r.user_id === "string" ? r.user_id : r.user_id?.id;
          return rId !== userId;
        })
      );

      router.refresh();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${decision} user`);
    } finally {
      setActionLoading(null);
    }
  };

  const hasPending = joinRequests?.some((r: any) => r.status === "pending");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="relative rounded-xl">
          <Bell size={16} />
          {hasPending && (
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approval</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-4 text-center text-sm text-gray-500">Loading requests...</div>
          ) : enhancedRequests.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No pending requests</div>
          ) : (
            <div className="divide-y">
              {enhancedRequests.map((req, index) => {
                const userId =
                  typeof req.user_id === "string" ? req.user_id : req.user_id?.id;
                const isProcessing = actionLoading === userId;

                return (
                  <div key={index} className="flex items-center gap-3 py-3">
                    <Avatar>
                      <AvatarImage src={req.profile?.avatar_url} />
                      <AvatarFallback>
                        {(
                          req.profile?.nickname?.[0] ||
                          req.profile?.fullname?.[0] ||
                          req.profile?.username?.[0] ||
                          "?"
                        ).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">
                        {req.profile?.nickname ||
                          req.profile?.fullname ||
                          req.profile?.username ||
                          "Unknown User"}
                      </p>
                      <p className="text-muted-foreground truncate text-xs">
                        {req.requested_at
                          ? new Date(req.requested_at).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })
                          : "Unknown date"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="button-green-outline"
                        size="icon"
                        onClick={() => handleDecision(req, "approved")}
                        disabled={!!actionLoading}>
                        {isProcessing ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Check size={16} />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-xl hover:bg-red-50 hover:text-red-600"
                        size="icon"
                        onClick={() => handleDecision(req, "rejected")}
                        disabled={!!actionLoading}>
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
