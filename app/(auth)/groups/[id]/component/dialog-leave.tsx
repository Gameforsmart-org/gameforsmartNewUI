"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { leaveGroup } from "../../services/groups.service";
import { logGroupActivity } from "@/app/service/group/group.service";

// ─── DialogLeave ─────────────────────────────────────────────────────────────

interface DialogLeaveProps {
  groupId: string;
  currentMembers: any[];
}

export function DialogLeave({ groupId, currentMembers }: DialogLeaveProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { profileId } = useAuth();
  const router = useRouter();

  const handleLeave = async () => {
    if (!profileId) return;

    setLoading(true);
    try {
      await leaveGroup(groupId, profileId, currentMembers);
      await logGroupActivity(groupId, profileId, profileId, "leave");

      toast.success("You have left the group");
      setOpen(false);
      router.push("/groups");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to leave group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="button-orange-outline relative flex-1">
          <LogOut size={16} className="mr-2" />
          Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog">
        <DialogHeader>
          <DialogTitle className="text-orange-900">Leave Group</DialogTitle>
        </DialogHeader>
        <DialogDescription>Are you sure you want to leave this group?</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleLeave} disabled={loading}>
            {loading ? "Leaving..." : "Leave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DialogAction (kick / promote / demote) ──────────────────────────────────

interface DialogActionProps {
  action: "kick" | "promote" | "demote";
  userName: string;
  onConfirm: () => Promise<void>;
  children: React.ReactNode;
}

export function DialogAction({ action, userName, onConfirm, children }: DialogActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const labels: Record<typeof action, { title: string; btn: string; btnIng: string }> = {
    kick:    { title: "Kick User",    btn: "Kick",    btnIng: "Kicking..." },
    promote: { title: "Promote User", btn: "Promote", btnIng: "Promoting..." },
    demote:  { title: "Demote User",  btn: "Demote",  btnIng: "Demoting..." }
  };

  const { title, btn, btnIng } = labels[action];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="dialog">
        <DialogHeader>
          <DialogTitle className={action === "kick" ? "text-red-600" : "text-orange-600"}>
            {title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to {action} "{userName}"?
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={action === "kick" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={loading}
            className={action !== "kick" ? "button-orange" : ""}>
            {loading ? btnIng : btn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
