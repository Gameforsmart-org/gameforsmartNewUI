"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControl } from "@/components/pagination-control";
import { EllipsisVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { DialogAction } from "./dialog-leave";
import type { DetailedMember, MemberRole } from "../../types";

const ITEMS_PER_PAGE = 14;

interface MembersTabProps {
  members: DetailedMember[];
  profileId: string | null;
  userRole: string | undefined;
  loadingActionId: string | null;
  onAction: (memberId: string, action: "kick" | "promote" | "demote") => Promise<void>;
}

const ROLE_PRIORITY: Record<string, number> = { owner: 1, admin: 2, member: 3 };

export function MembersTab({
  members,
  profileId,
  userRole,
  loadingActionId,
  onAction
}: MembersTabProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedMembers = [...members].sort((a, b) => {
    if (profileId && a.id === profileId) return -1;
    if (profileId && b.id === profileId) return 1;

    const prioA = ROLE_PRIORITY[a.role?.toLowerCase()] ?? 4;
    const prioB = ROLE_PRIORITY[b.role?.toLowerCase()] ?? 4;
    if (prioA !== prioB) return prioA - prioB;

    return (a.name || "").toLowerCase().localeCompare((b.name || "").toLowerCase());
  });

  const totalItems = sortedMembers.length;
  const currentMembers = sortedMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {currentMembers.map((member, i) => {
          const role = member.role?.toLowerCase() as MemberRole;
          const isCurrentUser =
            profileId && (member.id === profileId || (member as any).user_id === profileId);
          const canManage =
            (userRole === "owner" && (role === "admin" || role === "member")) ||
            (userRole === "admin" && role === "member");

          return (
            <Card
              key={i}
              className="border-card rounded-xl py-0 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900">
              <div className="vertical-line" />
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                      <AvatarImage src={member.avatar ?? ""} alt={member.name} />
                      <AvatarFallback className="rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                        {(member.name || "?").substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isCurrentUser && (
                      <Badge className="absolute -top-2 -right-4 rounded-full border-none bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500">
                        You
                      </Badge>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {member.name}
                      </p>
                      {role === "owner" && (
                        <Badge className="border-none bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500">
                          Owner
                        </Badge>
                      )}
                      {role === "admin" && (
                        <Badge className="border-none bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                          Admin
                        </Badge>
                      )}
                      {role === "member" && (
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Member
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate text-xs">{member.username}</p>
                  </div>
                </div>

                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <EllipsisVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="dark:border-zinc-800 dark:bg-zinc-900">
                      <DialogAction
                        action="kick"
                        userName={member.name}
                        onConfirm={() => onAction(member.id, "kick")}>
                        <DropdownMenuItem
                          className="focus:text-red-600 dark:focus:text-red-400"
                          onSelect={(e) => e.preventDefault()}>
                          Kick
                        </DropdownMenuItem>
                      </DialogAction>

                      {role === "member" && (
                        <DialogAction
                          action="promote"
                          userName={member.name}
                          onConfirm={() => onAction(member.id, "promote")}>
                          <DropdownMenuItem
                            className="focus:text-green-600 dark:focus:text-green-400"
                            onSelect={(e) => e.preventDefault()}>
                            Promote to Admin
                          </DropdownMenuItem>
                        </DialogAction>
                      )}

                      {role === "admin" && (
                        <DialogAction
                          action="demote"
                          userName={member.name}
                          onConfirm={() => onAction(member.id, "demote")}>
                          <DropdownMenuItem
                            className="focus:text-orange-600 dark:focus:text-orange-400"
                            onSelect={(e) => e.preventDefault()}>
                            Demote to Member
                          </DropdownMenuItem>
                        </DialogAction>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-muted-foreground mt-4 flex items-center justify-center gap-4 text-sm">
        <PaginationControl
          totalItems={totalItems}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </>
  );
}
