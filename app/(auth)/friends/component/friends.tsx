"use client";

import { useRef, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCard } from "./user-card";
import { SearchFriends } from "./search-friends";
import { useFriendsData } from "../hooks/use-friends-data";
import { TAB_LIST, type TabKey } from "../types";

interface FriendsProps {
  currentUserId: string;
}

export function Friends({ currentUserId }: FriendsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const initialTab = (searchParams.get("tab") as TabKey) || "friends";
  const [activeTab, setActiveTabState] = useState<TabKey>(initialTab);

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab as TabKey);
    router.push(`?tab=${tab}`);
  };

  const {
    users,
    loading,
    followedIds,
    currentLocationFilter,
    handleSearch,
    updateLocationFilter,
    fetchData
  } = useFriendsData(currentUserId, activeTab);

  // Global keyboard shortcut: K or Ctrl+K focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      const focusSearch = () => {
        e.preventDefault();
        const input = document.getElementById("friends-search-input");
        if (input) {
          (input as HTMLInputElement).focus();
        } else {
          searchInputRef.current?.focus();
        }
      };

      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        focusSearch();
        return;
      }

      if (e.key.toLowerCase() === "k" && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        focusSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Tab header + Search */}
      <div className="flex items-center justify-between border-gray-100 dark:border-gray-800">
        <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
          {TAB_LIST.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="tabs-trigger">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex w-full items-center justify-end sm:w-auto">
          <SearchFriends
            ref={searchInputRef}
            activeTab={activeTab}
            onSearch={handleSearch}
            locationFilter={currentLocationFilter}
            setLocationFilter={updateLocationFilter}
            onApplyFilter={() => {}}
          />
        </div>
      </div>

      {/* Tab content */}
      {TAB_LIST.map(({ value: tab }) => (
        <TabsContent key={tab} value={tab} className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  tab={tab}
                  currentUserId={currentUserId}
                  onActionComplete={fetchData}
                  isFollowing={
                    (activeTab === "find" || activeTab === "follower") &&
                    followedIds.includes(user.id)
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
