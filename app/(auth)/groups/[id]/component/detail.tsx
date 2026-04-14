"use client";

import { Calendar, Globe, Users } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroupDetail } from "../hooks/use-group-detail";
import { MembersTab } from "./members-tab";
import { ActivitiesTab } from "./activities-tab";
import { DialogLeave } from "./dialog-leave";
import DialogSettings from "./dialog-settings";
import DialogApproval from "./dialog-approval";
import DialogAdd from "./dialog-add";
import type { DetailedMember } from "../../types";

interface GroupDetailProps {
  group: any;
  members: DetailedMember[];
}

export default function GroupDetail({ group, members }: GroupDetailProps) {
  const {
    profileId,
    loadingActionId,
    activityNames,
    activityLimit,
    setActivityLimit,
    handleAction
  } = useGroupDetail(group, members);

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

  const currentUser = members.find((m) => m.id === profileId);
  const userRole = currentUser?.role?.toLowerCase();

  const activities: any[] = Array.isArray(group.activities) ? group.activities : [];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* ── Left Sidebar ─────────────────────────────────────── */}
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
            {/* Group Info */}
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {group.name}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">{group.description}</p>
            </div>

            {/* Stats */}
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

            {/* Owner / Admin actions */}
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

            {/* Member actions */}
            {userRole === "member" && (
              <div className="flex pt-4">
                <DialogLeave groupId={group.id} currentMembers={group.members} />
              </div>
            )}

            {/* Visitor fallback */}
            {!userRole && (
              <div className="pt-4">
                <Button className="button-green w-full">Join Group</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Right Content ─────────────────────────────────────── */}
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

          <TabsContent value="members">
            <MembersTab
              members={members}
              profileId={profileId}
              userRole={userRole}
              loadingActionId={loadingActionId}
              onAction={handleAction}
            />
          </TabsContent>

          <TabsContent value="activities">
            <ActivitiesTab
              activities={activities}
              activityLimit={activityLimit}
              activityNames={activityNames}
              onShowMore={() => setActivityLimit((prev) => prev + 10)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
