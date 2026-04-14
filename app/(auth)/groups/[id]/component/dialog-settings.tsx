"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Globe, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { updateGroupSettings } from "../../services/groups.service";
import { GROUP_CATEGORY_OPTIONS } from "../../types";

interface DialogSettingsProps {
  group: any;
}

export default function DialogSettings({ group }: DialogSettingsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState("");
  const [groupStatus, setGroupStatus] = useState("public");
  const [groupDescription, setGroupDescription] = useState("");
  const [adminsApproval, setAdminsApproval] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (group) {
      setGroupName(group.name || "");
      setGroupCategory(group.category || "");
      setGroupDescription(group.description || "");
      setGroupStatus(group.settings?.status || "public");
      setAdminsApproval(group.settings?.admins_approval || false);
    }
  }, [group]);

  const handleSave = async () => {
    if (!groupName || !groupCategory) {
      return toast.error("Group Name and Category are required");
    }

    setLoading(true);
    try {
      await updateGroupSettings({
        groupId: group.id,
        name: groupName,
        category: groupCategory,
        description: groupDescription,
        status: groupStatus,
        adminsApproval,
        currentSettings: group.settings
      });

      toast.success("Group settings updated successfully");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update group settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="button-yellow-outline flex-1">
          <Settings size={16} className="mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog w-full max-w-md min-w-0 gap-0">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-orange-900">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* Name */}
          <div className="space-y-2">
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

          {/* Category */}
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

          {/* Group Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-orange-950">
              Type <span className="ml-1 text-red-500">*</span>
            </Label>

            <RadioGroup
              value={groupStatus}
              onValueChange={setGroupStatus}
              className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { value: "public",  label: "Public",  desc: "Anyone can join",  icon: Globe,  activeColor: "text-green-500" },
                { value: "private", label: "Private", desc: "Request to join",  icon: Lock,   activeColor: "text-yellow-500" },
                { value: "secret",  label: "Secret",  desc: "Invite only",      icon: EyeOff, activeColor: "text-red-500" }
              ].map(({ value, label, desc, icon: Icon, activeColor }) => (
                <div key={value}>
                  <RadioGroupItem value={value} id={`settings-${value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`settings-${value}`}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-between rounded-xl border-2 p-4 transition-all duration-200",
                      "border-muted bg-popover hover:text-accent-foreground hover:bg-orange-50",
                      "peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-50/50",
                      "dark:peer-data-[state=checked]:border-orange-600 dark:peer-data-[state=checked]:bg-orange-900/20"
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

          {/* Approval toggle */}
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel htmlFor="switch-approval" className="text-orange-900">
                Approval
              </FieldLabel>
              <FieldDescription>
                If you activate this, you will need to approve anyone who wants to join this group.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="switch-approval"
              className="data-[state=unchecked]:bg-input data-[state=checked]:bg-green-500"
              checked={adminsApproval}
              onCheckedChange={setAdminsApproval}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-500">
            Cancel
          </Button>
          <Button
            className="bg-orange-500 px-6 font-semibold text-white hover:bg-orange-600"
            onClick={handleSave}
            disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
