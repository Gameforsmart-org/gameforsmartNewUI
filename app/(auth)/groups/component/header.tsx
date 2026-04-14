"use client";

import { useState } from "react";
import { ChevronDownIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GroupCard from "./group-card";
import DialogCreate from "./dialog-create";
import { GROUP_CATEGORY_OPTIONS } from "../types";
import type { GroupData } from "../types";

interface HeaderProps {
  discoverGroups: GroupData[];
  myGroups: GroupData[];
}

export default function Header({ discoverGroups, myGroups }: HeaderProps) {
  const [activeTab, setActiveTab] = useState("Discover");
  const [groupCategory, setGroupCategory] = useState("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleSearch = () => setSearchQuery(inputValue);

  const filterGroups = (groups: GroupData[]) =>
    groups.filter((group) => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        groupCategory === "All Categories" || group.category === groupCategory;
      return matchesSearch && matchesCategory;
    });

  const filteredDiscoverGroups = filterGroups(discoverGroups);
  const filteredMyGroups = filterGroups(myGroups);

  return (
    <div className="space-y-4">
      {/* Page Title + Search + Filter */}
      <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <div className="flex w-full items-center justify-between sm:w-auto">
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">Groups</h1>
        </div>

        <div className="flex w-full items-center space-x-2 sm:w-auto">
          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="input">
              <Button variant="outline" className="ml-auto">
                {groupCategory !== "All Categories"
                  ? GROUP_CATEGORY_OPTIONS.find((o) => o.value === groupCategory)?.labelEn ||
                    "Category"
                  : "Category"}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={groupCategory === "All Categories"}
                onCheckedChange={() => setGroupCategory("All Categories")}>
                All Categories
              </DropdownMenuCheckboxItem>
              {GROUP_CATEGORY_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={groupCategory === opt.value}
                  onCheckedChange={() => setGroupCategory(opt.value)}
                  className="capitalize">
                  {opt.labelEn}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Input */}
          <div className="relative w-full sm:w-auto">
            <Input
              placeholder="Search"
              className="input w-full pr-20 pl-3 sm:w-[250px]"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button
              variant="default"
              className="button-orange absolute top-1 right-1 h-7 w-7 p-2"
              onClick={handleSearch}>
              <Search size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full gap-0">
        <div className="flex items-center justify-between">
          <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
            {[
              { value: "Discover", label: "Discover" },
              { value: "MyGroup", label: "My Group" }
            ].map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="tabs-trigger">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex w-full flex-row items-center justify-end gap-2 sm:w-auto">
            <DialogCreate />
          </div>
        </div>

        <TabsContent value="Discover" className="mt-4">
          <GroupCard
            groups={filteredDiscoverGroups}
            key={`discover-${searchQuery}-${groupCategory}`}
          />
        </TabsContent>

        <TabsContent value="MyGroup" className="mt-4">
          <GroupCard
            groups={filteredMyGroups}
            isMyGroup
            key={`mygroup-${searchQuery}-${groupCategory}`}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
