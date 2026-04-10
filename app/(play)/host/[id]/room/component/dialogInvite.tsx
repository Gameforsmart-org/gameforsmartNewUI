"use client";

import { useState, useEffect } from "react";
import { createNotification } from "@/app/service/notification";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Share2, Users, X, Loader2, RefreshCcw, Search, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Shared props interface
export interface InviteProps {
  sessionId?: string;
}

export function InviteFriend({ sessionId = "" }: InviteProps) {
  const [open, setOpen] = useState(false);
  const { profileId } = useAuth();

  type Friend = {
    id: string;
    fullname: string | null;
    username: string;
    avatar_url?: string | null;
  };

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    setSearchTerm(inputValue);
  };

  const fetchFriends = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const { data: following } = await supabase
        .from("friendships")
        .select("addressee_id")
        .eq("requester_id", profileId);

      const { data: followers } = await supabase
        .from("friendships")
        .select("requester_id")
        .eq("addressee_id", profileId);

      const followingIds = following?.map((f) => f.addressee_id) || [];
      const followerIds = followers?.map((f) => f.requester_id) || [];

      const mutualIds = followingIds.filter((id) => followerIds.includes(id));

      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, nickname, fullname, avatar_url")
          .in("id", mutualIds);

        const mapped = (profiles || []).map((p: any) => ({
          id: p.id,
          username: p.username,
          fullname: p.fullname || p.nickname || p.username,
          avatar_url: p.avatar_url
        }));
        setFriends(mapped);
      } else {
        setFriends([]);
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Failed to load friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFriends();
      setSearchTerm("");
      setSentIds(new Set());
      setSendingIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileId]);

  const filtered = friends.filter((f) => {
    const search = searchTerm.toLowerCase();
    return (
      f.username?.toLowerCase().includes(search) ||
      (f.fullname && f.fullname.toLowerCase().includes(search))
    );
  });

  const handleInviteFriend = async (friend: Friend) => {
    if (!profileId || sendingIds.has(friend.id) || sentIds.has(friend.id)) return;

    setSendingIds((prev) => new Set(prev).add(friend.id));
    try {
      const timestamp = new Date().toISOString();

      await createNotification([
        {
          user_id: friend.id,
          actor_id: profileId,
          type: "sessionFriend",
          entity_type: "session",
          entity_id: sessionId,
          status: null,
          content: null,
          is_read: false,
          created_at: timestamp
        }
      ]);

      setSentIds((prev) => new Set(prev).add(friend.id));
      toast.success(`Invite sent to ${friend.fullname || friend.username}!`);
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error(`Failed to invite ${friend.fullname || friend.username}`);
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(friend.id);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-orange-200 text-xs text-orange-600 hover:bg-orange-50">
          <Share2 className="mr-2 size-3" /> Invite Friends
        </Button>
      </DialogTrigger>
      <DialogContent className="dialog w-full max-w-md min-w-0 gap-0 p-0">
        <DialogHeader className="border-b border-orange-100 p-6">
          <DialogTitle className="text-lg font-semibold text-orange-600">
            Invite Friends
          </DialogTitle>
        </DialogHeader>

        <div className="max-w-full min-w-0 space-y-5 p-6">
          <div className="relative">
            <Input
              placeholder="Search by name or username..."
              className="border-orange-200 focus-visible:ring-orange-500"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="default"
              className="absolute top-1 right-1 h-7 w-7 bg-orange-400 p-2 hover:bg-orange-500"
              onClick={handleSearch}>
              <Search size={20} />
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-4 text-orange-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                {searchTerm ? "No friends found matching search." : "No mutual friends found."}
              </p>
            ) : (
              filtered.map((friend) => {
                const isSent = sentIds.has(friend.id);
                const isSending = sendingIds.has(friend.id);

                return (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between border-b border-orange-50 py-1.5 last:border-0">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={friend.avatar_url || ""} />
                        <AvatarFallback className="bg-green-500 font-bold text-white">
                          {(friend.fullname?.[0] || friend.username?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{friend.fullname}</p>
                        <p className="text-xs text-gray-500">@{friend.username}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleInviteFriend(friend)}
                      disabled={isSent || isSending}
                      className={
                        isSent
                          ? "bg-green-500 text-white shadow-sm hover:bg-green-600"
                          : "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                      }>
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isSent ? (
                        <>
                          <Check className="mr-1 h-3 w-3" /> Sent
                        </>
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-orange-100 bg-orange-50/20 p-6">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:bg-orange-50 hover:text-orange-600">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InviteGroup({ sessionId = "" }: InviteProps) {
  const [open, setOpen] = useState(false);
  const { profileId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    setSearchTerm(inputValue);
  };

  type Group = {
    id: string; // id is string/uuid
    name: string;
    members: any[]; // JSONB
    member_count?: number; // derived
  };

  const [groups, setGroups] = useState<Group[]>([]);

  const fetchGroups = async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      // 1. Fetch groups where user is a member
      // Use "user_id" key assumption first
      let { data, error } = await supabase.from("groups").select("id, name, members");
      // Note: Client-side filtering is safer without knowing exact JSON structure
      // for "contains" operator which can be finicky.
      // Fetching all groups might be heavy, but typically users don't have thousands of groups.
      // Better: Filter by creator if index exists, but user might be admin not creator.

      // Let's try to filter by contains if possible, but fallback to client side filter if empty.

      if (error) throw error;

      const myGroups = (data || []).filter((g: any) => {
        const members = Array.isArray(g.members) ? g.members : [];
        // Find user in members
        const member = members.find((m: any) => m.user_id === profileId || m.id === profileId);
        // Check role
        return member && (member.role === "owner" || member.role === "admin");
      });

      const mapped = myGroups.map((g: any) => ({
        id: g.id,
        name: g.name,
        members: g.members,
        member_count: Array.isArray(g.members) ? g.members.length : 0
      }));

      setGroups(mapped);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchGroups();
      setSearchTerm("");
      setSentIds(new Set());
      setSendingIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileId]);

  const filtered = groups.filter((g) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleInviteGroup = async (group: Group) => {
    if (!profileId || sendingIds.has(group.id) || sentIds.has(group.id)) return;

    setSendingIds((prev) => new Set(prev).add(group.id));
    try {
      const timestamp = new Date().toISOString();
      const allNotifications: any[] = [];

      const members = Array.isArray(group.members) ? group.members : [];
      members.forEach((m: any) => {
        const mId = m.user_id || m.id;
        // Send to member if valid and not self
        if (mId && mId !== profileId) {
          allNotifications.push({
            // id: generated by db trigger
            user_id: mId,
            actor_id: profileId,
            type: "sessionGroup",
            entity_type: "session",
            entity_id: sessionId,
            from_group_id: group.id,
            status: null,
            content: null, // As requested
            is_read: false,
            created_at: timestamp
          });
        }
      });

      if (allNotifications.length > 0) {
        await createNotification(allNotifications);
        setSentIds((prev) => new Set(prev).add(group.id));
        toast.success(
          `Invites sent to ${allNotifications.length} members in ${group.name}!`
        );
      } else {
        toast.info("No other members to invite in this group.");
      }
    } catch (error) {
      console.error("Error sending group invite:", error);
      toast.error(`Failed to invite ${group.name}`);
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(group.id);
        return next;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-orange-200 text-xs text-orange-600 hover:bg-orange-50">
          <Users className="mr-2 size-3" /> Invite Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md gap-0 overflow-hidden rounded-2xl border border-orange-500 bg-white p-0">
        <DialogHeader className="border-b border-orange-100 p-6">
          <DialogTitle className="text-lg font-semibold text-orange-600">Invite Groups</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 p-6">
          <div className="relative">
            <Input
              placeholder="Search group..."
              className="border-orange-200 focus-visible:ring-orange-500"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              variant="default"
              className="absolute top-1 right-1 h-7 w-7 bg-orange-400 p-2 hover:bg-orange-500"
              onClick={handleSearch}>
              <Search size={20} />
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex justify-center py-4 text-orange-500">
                <Loader2 className="animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-500">
                {searchTerm
                  ? "No groups found matching search."
                  : "No groups where you are admin/owner."}
              </p>
            ) : (
              filtered.map((group) => {
                const isSent = sentIds.has(group.id);
                const isSending = sendingIds.has(group.id);

                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between border-b border-orange-50 py-1.5 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{group.name}</p>
                      <p className="text-xs font-medium text-orange-400">
                        {group.member_count} members
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleInviteGroup(group)}
                      disabled={isSent || isSending}
                      className={
                        isSent
                          ? "bg-green-500 text-white shadow-sm hover:bg-green-600"
                          : "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                      }>
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isSent ? (
                        <>
                          <Check className="mr-1 h-3 w-3" /> Sent
                        </>
                      ) : (
                        "Invite"
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-orange-100 bg-orange-50/20 p-6">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-500 hover:text-orange-600">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
