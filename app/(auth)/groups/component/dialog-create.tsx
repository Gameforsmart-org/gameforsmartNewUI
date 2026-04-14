"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EyeOff, Globe, Lock, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { createGroup } from "../services/groups.service";
import { GROUP_CATEGORY_OPTIONS } from "../types";

export default function DialogCreate() {
  const [open, setOpen] = useState(false);
  const { profileId } = useAuth();

  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState("");
  const [groupStatus, setGroupStatus] = useState<"public" | "private" | "secret">("public");
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setGroupName("");
    setGroupCategory("");
    setGroupStatus("public");
    setGroupDescription("");
  };

  const handleCreate = async () => {
    if (!profileId) return toast.error("You must be logged in to create a group");
    if (!groupName.trim()) return toast.error("Group name is required");
    if (!groupCategory) return toast.error("Category is required");

    setLoading(true);
    try {
      await createGroup({
        name: groupName,
        category: groupCategory,
        description: groupDescription.trim() || null,
        creator_id: profileId,
        status: groupStatus
      });

      toast.success("Group created successfully!");
      setOpen(false);
      resetForm();
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="button-green">
          <PlusIcon className="hidden sm:block" />
          <span className="hidden sm:inline">Create Group</span>
          <span className="inline sm:hidden">Create</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog w-full max-w-md min-w-0 gap-0 p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-lg font-semibold text-orange-950">Create Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* Name + Category */}
          <div className="flex gap-3">
            <div className="w-full space-y-2">
              <Label htmlFor="groupName" className="text-orange-900">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="groupName"
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupCategory" className="text-orange-900">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={groupCategory} onValueChange={setGroupCategory}>
                <SelectTrigger id="groupCategory" className="input">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {GROUP_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Group Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-orange-950">
              Group Type <span className="ml-1 text-red-500">*</span>
            </Label>

            <RadioGroup
              value={groupStatus}
              onValueChange={(v) => setGroupStatus(v as typeof groupStatus)}
              className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  value: "public",
                  label: "Public",
                  desc: "Anyone can join",
                  icon: Globe,
                  activeColor: "text-emerald-500"
                },
                {
                  value: "private",
                  label: "Private",
                  desc: "Request to join",
                  icon: Lock,
                  activeColor: "text-amber-500"
                },
                {
                  value: "secret",
                  label: "Secret",
                  desc: "Invite only",
                  icon: EyeOff,
                  activeColor: "text-red-500"
                }
              ].map(({ value, label, desc, icon: Icon, activeColor }) => (
                <div key={value}>
                  <RadioGroupItem value={value} id={value} className="peer sr-only" />
                  <Label
                    htmlFor={value}
                    className={cn(
                      "border-muted bg-popover hover:text-accent-foreground flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 peer-data-[state=checked]:border-orange-500 hover:bg-orange-50 [&:has([data-state=checked])]:border-orange-500",
                      groupStatus === value ? "border-orange-500 bg-orange-50/50" : ""
                    )}>
                    <Icon
                      className={cn(
                        "mb-3 h-6 w-6 transition-colors",
                        groupStatus === value ? activeColor : "text-muted-foreground"
                      )}
                    />
                    <div className="space-y-1 text-center">
                      <p className="text-sm leading-none font-medium">{label}</p>
                      <p className="text-muted-foreground text-xs">{desc}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="groupDescription" className="text-orange-900">
              Description
            </Label>
            <Textarea
              id="groupDescription"
              placeholder="Enter group description"
              rows={2}
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-6">
          <Button variant="outline" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>
          <Button className="button-orange" onClick={handleCreate} disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
