"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Building2, Users2, UserCheck, UserPlus } from "lucide-react";
import type { PublicProfileData } from "@/app/service/profile/profile.service";

export function PublicProfileView({ data }: { data: PublicProfileData }) {
  const { profile } = data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Profile Card */}
      <Card className="overflow-hidden border-0 shadow-xl">
        {/* Banner gradient */}
        <div className="relative h-32 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMS41IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-60" />
        </div>

        <CardContent className="relative px-6 pb-6">
          {/* Avatar - overlapping banner */}
          <div className="-mt-16 mb-4 flex justify-center">
            <div className="rounded-full border-4 border-white shadow-lg dark:border-zinc-900">
              <Avatar className="h-28 w-28">
                <AvatarImage src={profile.avatar} alt={profile.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-teal-400 to-emerald-500 text-2xl font-bold text-white">
                  {profile.fullName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Names */}
          <div className="text-center">
            {data.nickname && (
              <p className="text-sm font-medium text-teal-600 dark:text-teal-400">
                {data.nickname}
              </p>
            )}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {profile.fullName}
            </h2>
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 p-4 dark:bg-zinc-800/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <Users2 className="h-4 w-4 text-teal-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {profile.followers}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">Followers</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <UserPlus className="h-4 w-4 text-emerald-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {profile.following}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">Following</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <UserCheck className="h-4 w-4 text-cyan-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {profile.friends}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">Friends</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
            About
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {/* Nickname */}
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Nickname
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {data.nickname || "-"}
              </p>
            </div>

            {/* Full Name */}
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Full Name
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {data.fullName || "-"}
              </p>
            </div>

            {/* Username */}
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Username
              </p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                @{data.username}
              </p>
            </div>

            {/* Gender */}
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Gender
              </p>
              <p className="mt-1 font-medium capitalize text-gray-900 dark:text-white">
                {data.gender || "-"}
              </p>
            </div>

            {/* Organization */}
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Organization / Institution
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Building2 className="text-muted-foreground h-4 w-4" />
                <p className="font-medium text-gray-900 dark:text-white">
                  {data.organization || "-"}
                </p>
              </div>
            </div>

            {/* Country */}
            <div>
              <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                Country
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <MapPin className="text-muted-foreground h-4 w-4" />
                <p className="font-medium text-gray-900 dark:text-white">
                  {data.country}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
