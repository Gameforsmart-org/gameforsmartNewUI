"use client";

import { useState } from "react";
import { Check, EllipsisVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { followUser, unfollowUser, removeFollower } from "../services/friends.service";
import { RemoveFollowerDialog } from "./remove-follower-dialog";
import type { Profile } from "../types";

const FALLBACK_AVATAR =
  "https://images.unsplash.com/vector-1738312097380-45562da00459?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

interface UserCardProps {
  user: Profile;
  tab: string;
  currentUserId: string;
  onActionComplete: () => void;
  isFollowing?: boolean;
}

export function UserCard({
  user,
  tab,
  currentUserId,
  onActionComplete,
  isFollowing = false
}: UserCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleFollow = async () => {
    try {
      await followUser(currentUserId, user.id);
      toast.success(`Followed ${user.username}`);
      onActionComplete();
    } catch {
      toast.error("Failed to follow");
    }
  };

  const handleUnfollow = async () => {
    try {
      await unfollowUser(currentUserId, user.id);
      toast.success(`Unfollowed ${user.username}`);
      onActionComplete();
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  const handleRemoveFollower = async () => {
    try {
      await removeFollower(currentUserId, user.id);
      toast.success("Removed follower");
      setIsDeleteDialogOpen(false);
      onActionComplete();
    } catch {
      toast.error("Failed to remove follower");
    }
  };

  const locationParts = [
    user.cities?.name,
    user.states?.name,
    user.countries?.name
  ].filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(", ") : null;

  return (
    <Card className="border-card py-2">
      <div className="vertical-line" />
      <CardContent className="flex flex-row items-center justify-between gap-4">
        {/* Avatar */}
        <div>
          <img
            src={user.avatar_url || FALLBACK_AVATAR}
            alt={user.username}
            className="h-12 w-12 rounded-full object-cover"
          />
        </div>

        {/* User Info */}
        <div className="flex flex-1 flex-col items-start overflow-hidden">
          <div
            title={user.fullname || user.username}
            className="text-md line-clamp-1 font-semibold break-words">
            {user.fullname || user.username}
          </div>
          <div className="text-muted-foreground line-clamp-1 text-sm font-medium break-words">
            {user.nickname && <span className="mr-1">{user.nickname}</span>}@{user.username}
          </div>
          {locationString && (
            <div
              className="text-muted-foreground line-clamp-1 text-xs break-words"
              title={locationString}>
              {locationString}
            </div>
          )}
        </div>

        {/* Actions */}
        {(tab === "friends" || tab === "following") && (
          <Button variant="secondary" size="sm" onClick={handleUnfollow}>
            Unfollow
          </Button>
        )}

        {tab === "follower" && (
          <div className="flex items-center gap-2">
            {isFollowing && (
              <span className="text-muted-foreground text-xs font-medium">Followed</span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isFollowing && (
                  <DropdownMenuItem onClick={handleFollow}>Follback</DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600">
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <RemoveFollowerDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
              onConfirm={handleRemoveFollower}
            />
          </div>
        )}

        {tab === "find" &&
          (isFollowing ? (
            <Button variant="secondary" size="sm" disabled>
              <Check size={16} className="mr-1" /> Followed
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleFollow} className="button-orange">
              <Plus size={16} className="mr-1" /> Follow
            </Button>
          ))}
      </CardContent>
    </Card>
  );
}
