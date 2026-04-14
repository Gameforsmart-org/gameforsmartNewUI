"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { searchProfiles } from "../../services/groups.service";
import { createNotification } from "@/app/service/notification";

interface DialogAddProps {
  groupId: string;
}

export default function DialogAdd({ groupId }: DialogAddProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const { profileId } = useAuth();

  const handleSearch = async () => {
    if (!inputValue.trim()) return toast.error("Please enter a search term");

    setLoading(true);
    setHasSearched(true);
    setSearchResults([]);

    try {
      const results = await searchProfiles(inputValue);
      setSearchResults(results);
    } catch (error: any) {
      toast.error("Failed to search users");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (userId: string) => {
    if (!profileId) return toast.error("You must be logged in to invite users");
    if (!groupId) return toast.error("Group ID is missing");

    setInvitingId(userId);
    try {
      await createNotification({
        user_id: userId,
        actor_id: profileId,
        type: "group",
        entity_type: "group",
        entity_id: null,
        from_group_id: groupId,
        is_read: false,
        status: null,
        content: null
      });

      toast.success("Invitation sent successfully");
    } catch (error: any) {
      toast.error("Failed to send invitation");
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="button-orange w-full">Add Member</Button>
      </DialogTrigger>
      <DialogContent className="dialog w-full max-w-md min-w-0 gap-0 p-0">
        <DialogHeader className="border-b border-orange-100 p-6">
          <DialogTitle className="text-lg font-semibold text-orange-900">Add Member</DialogTitle>
        </DialogHeader>

        <div className="max-w-full min-w-0 space-y-5 p-6">
          {/* Search Input */}
          <div className="relative">
            <Input
              placeholder="Search by nickname, fullname, or username..."
              className="input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              variant="default"
              className="button-orange absolute top-1 right-1 h-7 w-7 p-2"
              onClick={handleSearch}
              disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={20} />}
            </Button>
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-4 text-orange-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : hasSearched && searchResults.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-500">No users found.</div>
            ) : (
              searchResults.map((profile) => {
                if (profile.id === profileId) return null;
                const isInviting = invitingId === profile.id;

                return (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between border-b border-orange-50 py-1.5 last:border-0">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="bg-green-500 font-bold text-white">
                          {(
                            profile.fullname?.[0] ||
                            profile.username?.[0] ||
                            profile.nickname?.[0] ||
                            "?"
                          ).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium">
                          {[profile.nickname, profile.fullname].filter(Boolean).join(" - ") ||
                            "Unknown User"}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {[
                            profile.username ? `@${profile.username}` : null,
                            [profile.state?.name, profile.city?.name].filter(Boolean).join(", ")
                          ]
                            .filter(Boolean)
                            .join(" - ") || ""}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="button-orange"
                      onClick={() => handleInvite(profile.id)}
                      disabled={isInviting || loading}>
                      {isInviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
