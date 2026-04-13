"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RemoveFollowerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function RemoveFollowerDialog({
  open,
  onOpenChange,
  onConfirm
}: RemoveFollowerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dialog">
        <DialogHeader>
          <DialogTitle className="text-orange-950 dark:text-orange-200">
            Remove Follower
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this follower?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="button-orange">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
