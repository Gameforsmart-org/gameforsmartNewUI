"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { Calendar, EllipsisVertical, Globe, LogIn, LogOut, ArrowBigUp, ArrowBigDown, UserX, Users, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { PaginationControl } from "./pagination-control";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatTimeAgo } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import DialogSettings from "./dialogsettings";
import { DialogLeave, DialogAction } from "./dialogleave";
import DialogApproval from "./dialogapproval";
import DialogAdd from "./dialogadd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useGroupActivities } from "@/hooks/useGroupActivities";

interface GroupDetailProps {
  group: any;
  members: any[];
}

export default function GroupDetail({ group, members }: GroupDetailProps) {
  const { profileId } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const router = useRouter();
  const { logActivity } = useGroupActivities();
  const ITEMS_PER_PAGE = 14;

  // ── Resolve activity user names ────────────────────────────
  const [activityNames, setActivityNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const activities: any[] = Array.isArray(group.activities) ? group.activities : [];
    if (activities.length === 0) return;

    // Collect all unique user IDs from activities
    const allIds = new Set<string>();
    activities.forEach((a: any) => {
      if (a.user_id) allIds.add(a.user_id);
      if (a.actor_id) allIds.add(a.actor_id);
    });

    // Build name map from existing members first
    const nameMap: Record<string, string> = {};
    members.forEach((m: any) => {
      nameMap[m.id] = m.name;
    });

    // Find IDs not in members
    const missingIds = [...allIds].filter((id) => !nameMap[id]);

    if (missingIds.length === 0) {
      setActivityNames(nameMap);
      return;
    }

    // Fetch missing profiles
    supabase
      .from("profiles")
      .select("id, fullname, nickname")
      .in("id", missingIds)
      .then(({ data }) => {
        data?.forEach((p: any) => {
          nameMap[p.id] = p.fullname || p.nickname || "Unknown User";
        });
        setActivityNames({ ...nameMap });
      });
  }, [group.activities, members]);

  const [activityLimit, setActivityLimit] = useState(10);

  const handleAction = async (memberUserId: string, action: "kick" | "promote" | "demote") => {
    setLoadingActionId(memberUserId);
    try {
      const { data: groupData, error: fetchError } = await supabase
        .from("groups")
        .select("members")
        .eq("id", group.id)
        .single();
      if (fetchError) throw fetchError;

      let updatedMembers = groupData.members || [];
      const isMatch = (m: any) => (m.user_id || m.id) === memberUserId;

      if (action === "kick") {
        updatedMembers = updatedMembers.filter((m: any) => !isMatch(m));
      } else if (action === "promote") {
        updatedMembers = updatedMembers.map((m: any) => (isMatch(m) ? { ...m, role: "admin" } : m));
      } else if (action === "demote") {
        updatedMembers = updatedMembers.map((m: any) =>
          isMatch(m) ? { ...m, role: "member" } : m
        );
      }

      const { error: updateError } = await supabase
        .from("groups")
        .update({ members: updatedMembers })
        .eq("id", group.id);

      if (updateError) throw updateError;

      // Log activity
      if (profileId) {
        await logActivity(group.id, memberUserId, profileId, action);
      }

      toast.success(
        `User ${action === "kick" ? "kicked" : action === "promote" ? "promoted" : "demoted"} successfully`
      );
      router.refresh();
    } catch (err: any) {
      toast.error(`Failed to ${action} user`);
      console.error(err);
    } finally {
      setLoadingActionId(null);
    }
  };

  if (!group) return <div>Loading...</div>;

  const createdAt = group.created_at
    ? new Date(group.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "-";

  const status = group.settings?.status || "public";
  const approval = group.settings?.admins_approval;

  // Determine current user role (ensure case-insensitive check if needed, but assuming lowercase from DB)
  const currentUser = members.find((m) => m.id === profileId);
  const userRole = currentUser?.role?.toLowerCase();

  // Sorting Logic
  const sortedMembers = [...members].sort((a: any, b: any) => {
    // 1. Current user always first
    if (profileId && a.id === profileId) return -1;
    if (profileId && b.id === profileId) return 1;

    // 2. Sort by role priority
    const rolePriority: Record<string, number> = { owner: 1, admin: 2, member: 3 };
    const roleA = a.role?.toLowerCase() || "member";
    const roleB = b.role?.toLowerCase() || "member";

    const priorityA = rolePriority[roleA] || 4;
    const priorityB = rolePriority[roleB] || 4;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // 3. Sort alphabetically by name
    const nameA = a.name?.toLowerCase() || "";
    const nameB = b.name?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });

  // Pagination Logic
  const totalItems = sortedMembers.length;
  const currentMembers = sortedMembers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* ================= LEFT SIDEBAR ================= */}
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/groups"
                  className="hover:text-orange-600 dark:hover:text-orange-400">
                  Groups
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Detail</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Card
            className="card h-fit py-0"
            style={
              { "--card-border-w": "1px", "--border-color": "var(--border)" } as React.CSSProperties
            }>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {group.name}
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">{group.description}</p>
              </div>

              <div className="text-muted-foreground space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div title="Members" className="text-orange-500 dark:text-orange-700">
                    <Users size={16} />
                  </div>
                  {members.length} members
                </div>

                <div className="flex items-center gap-2">
                  <div title="Created" className="text-yellow-500 dark:text-yellow-700">
                    <Calendar size={16} />
                  </div>
                  {createdAt}
                </div>

                <div className="flex items-center gap-2">
                  <div title="Visibility" className="text-green-500 dark:text-green-700">
                    <Globe size={16} />
                  </div>
                  {status}
                </div>
              </div>

              {/* Owner & Admin Actions */}
              {(userRole === "owner" || userRole === "admin") && (
                <div>
                  <div className="pt-2">
                    <DialogAdd groupId={group.id} />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <DialogSettings group={group} />

                    <DialogLeave groupId={group.id} currentMembers={group.members} />
                  </div>
                </div>
              )}

              {/* Member Actions */}
              {userRole === "member" && (
                <div className="flex pt-4">
                  

                  <DialogLeave groupId={group.id} currentMembers={group.members} />
                </div>
              )}

              {/* Non-Member Actions (Visitor) */}
              {!userRole && (
                <div className="pt-4">
                  <Button className="button-green w-full">Join Group</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ================= RIGHT CONTENT ================= */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="members">
            <div className="mb-2 flex items-center justify-between">
              <TabsList className="bg-transparent">
                {[
                  { value: "members", label: "Members" },
                  { value: "activities", label: "Activities" }
                ].map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="tabs-trigger">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(userRole === "admin" || userRole === "owner") && approval === true && (
                <DialogApproval groupId={group.id} joinRequests={group.join_requests} />
              )}
            </div>

            {/* MEMBERS TAB */}
            <TabsContent value="members">
              <div className="grid gap-4 md:grid-cols-2">
                {currentMembers.map((member: any, i: number) => {
                  const role = member.role?.toLowerCase();
                  return (
                    <Card
                      key={i}
                      className="border-card rounded-xl py-0 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="vertical-line" />
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {/* Avatar */}
                            <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                              <AvatarImage src={member.avatar} alt={member.name} />
                              <AvatarFallback className="rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                                {(member.name || "?").substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {profileId &&
                              (member.id === profileId || member.user_id === profileId) && (
                                <Badge className="absolute -top-2 -right-4 rounded-full border-none bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500">
                                  You
                                </Badge>
                              )}
                          </div>

                          {/* Info */}
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
                                <Badge
                                  variant="secondary"
                                  className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                  Member
                                </Badge>
                              )}
                            </div>

                            <p className="text-muted-foreground truncate text-xs">
                              {member.username}
                            </p>
                          </div>
                        </div>
                        {/* Dropdown Menu action*/}
                        {((userRole === "owner" && (role === "admin" || role === "member")) ||
                          (userRole === "admin" && role === "member")) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                <EllipsisVertical />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="dark:border-zinc-800 dark:bg-zinc-900">
                              <DialogAction
                                action="kick"
                                userName={member.name}
                                onConfirm={() => handleAction(member.id, "kick")}>
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
                                  onConfirm={() => handleAction(member.id, "promote")}>
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
                                  onConfirm={() => handleAction(member.id, "demote")}>
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

              {/* Pagination */}
              <div className="text-muted-foreground mt-4 flex items-center justify-center gap-4 text-sm">
                <PaginationControl
                  totalItems={totalItems}
                  currentPage={currentPage}
                  onPageChange={setCurrentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </div>
            </TabsContent>

            <TabsContent value="activities">
              {(() => {
                const activities: any[] = Array.isArray(group.activities) ? group.activities : [];
                const sorted = [...activities].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                if (sorted.length === 0) {
                  return (
                    <Card className="rounded-xl border border-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <CardContent className="text-muted-foreground p-6 text-center text-sm">
                        No recent activities yet.
                      </CardContent>
                    </Card>
                  );
                }

                const visible = sorted.slice(0, activityLimit);
                const hasMore = activityLimit < sorted.length;

                const getName = (id: string) => activityNames[id] || "Unknown User";

                const getActivityIcon = (action: string) => {
                  switch (action) {
                    case "join":    return <LogIn size={16} className="text-green-500" />;
                    case "leave":   return <LogOut size={16} className="text-zinc-400" />;
                    case "kick":    return <UserX size={16} className="text-red-500" />;
                    case "promote": return <ArrowBigUp size={16} className="text-blue-500" />;
                    case "demote":  return <ArrowBigDown size={16} className="text-orange-500" />;
                    default:        return <Users size={16} className="text-zinc-400" />;
                  }
                };

                const getActivityMessage = (a: any) => {
                  const user = getName(a.user_id);
                  const actor = getName(a.actor_id);
                  switch (a.action) {
                    case "join":    return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{user}</span> joined the group</>;
                    case "leave":   return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{user}</span> left the group</>;
                    case "kick":    return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{actor}</span> kicked out <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user}</span></>;
                    case "promote": return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{actor}</span> promoted <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user}</span> to Admin</>;
                    case "demote":  return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{actor}</span> demoted <span className="font-semibold text-zinc-900 dark:text-zinc-100">{user}</span> to Member</>;
                    default:        return <><span className="font-semibold text-zinc-900 dark:text-zinc-100">{user}</span> performed an action</>;
                  }
                };

                return (
                  <div className="space-y-2">
                    {visible.map((activity: any, idx: number) => (
                      <Card
                        key={idx}
                        className="rounded-xl border border-zinc-200 py-0 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                        <CardContent className="flex items-center gap-3 px-4 py-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            {getActivityIcon(activity.action)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {getActivityMessage(activity)}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] font-medium text-zinc-400">
                            {formatTimeAgo(activity.created_at)}
                          </span>
                        </CardContent>
                      </Card>
                    ))}

                    {hasMore && (
                      <div className="flex justify-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActivityLimit((prev) => prev + 10)}
                          className="text-xs font-semibold text-zinc-500 hover:text-orange-600">
                          Show More
                          <ChevronDown size={16} className="" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
