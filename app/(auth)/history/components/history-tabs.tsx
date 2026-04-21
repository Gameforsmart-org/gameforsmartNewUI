"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { HistoryCard } from "./history-card";
import { HistoryTable } from "./history-table";
import { HistoryFilters } from "./history-filters";
import { ViewToggle } from "./view-toggle";
import { useHistoryFilter } from "../hooks/use-history-filter";
import type { QuizHistory } from "../types";

interface HistoryTabsProps {
  data: QuizHistory[];
}

export default function HistoryTabs({ data }: HistoryTabsProps) {
  const {
    model,          setModel,
    filterTime,     setFilterTime,
    filterCategory, setFilterCategory,
    filterLanguage, setFilterLanguage,
    sort,           setSort,
    inputValue,     setInputValue,
    handleSearch,
    filteredData,
    hostData,
    playerData
  } = useHistoryFilter(data);

  const renderContent = (items: QuizHistory[]) =>
    model === "grid"
      ? <HistoryCard quiz={items} />
      : <HistoryTable data={items} />;

  return (
    <Tabs defaultValue="all" className="w-full">
      {/* Tab header row */}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        {/* Tabs + mobile view toggle */}
        <div className="flex justify-between gap-2 sm:justify-start">
          <TabsList className="h-auto w-fit justify-start rounded-none bg-transparent p-0">
            <TabsTrigger value="all"    className="tabs-trigger">All ({filteredData.length})</TabsTrigger>
            <TabsTrigger value="host"   className="tabs-trigger">Host ({hostData.length})</TabsTrigger>
            <TabsTrigger value="player" className="tabs-trigger">Player ({playerData.length})</TabsTrigger>
          </TabsList>

          {/* View toggle — mobile only */}
          <div className="sm:hidden">
            <ViewToggle model={model} onModelChange={setModel} />
          </div>
        </div>

        {/* Filters + sort + search */}
        <HistoryFilters
          model={model}               onModelChange={setModel}
          sort={sort}                 onSortChange={setSort}
          filterTime={filterTime}     onFilterTimeChange={setFilterTime}
          filterCategory={filterCategory} onFilterCategoryChange={setFilterCategory}
          filterLanguage={filterLanguage} onFilterLanguageChange={setFilterLanguage}
          inputValue={inputValue}     onInputChange={setInputValue}
          onSearch={handleSearch}
        />
      </div>

      <TabsContent value="all"    className="mt-2">{renderContent(filteredData)}</TabsContent>
      <TabsContent value="host"   className="mt-2">{renderContent(hostData)}</TabsContent>
      <TabsContent value="player" className="mt-2">{renderContent(playerData)}</TabsContent>
    </Tabs>
  );
}
