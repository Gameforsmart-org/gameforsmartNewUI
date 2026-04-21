"use client";

import { useState, useMemo } from "react";
import type { QuizHistory, ViewMode, SortOrder, TimeFilter, FilterState } from "../types";

function applyTimeFilter(items: QuizHistory[], filterTime: TimeFilter): QuizHistory[] {
  if (filterTime === "all") return items;

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return items.filter((item) => {
    const itemDate = new Date(item.ended_at);
    const itemDay  = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

    switch (filterTime) {
      case "today":
        return itemDay.getTime() === today.getTime();

      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return itemDay.getTime() === yesterday.getTime();
      }

      case "this_week": {
        const diff = Math.floor((today.getTime() - itemDay.getTime()) / 86_400_000);
        return diff >= 0 && diff <= 7;
      }

      case "last_week": {
        const diff = Math.floor((today.getTime() - itemDay.getTime()) / 86_400_000);
        return diff > 7 && diff <= 14;
      }

      case "this_month":
        return (
          itemDate.getMonth()    === now.getMonth() &&
          itemDate.getFullYear() === now.getFullYear()
        );

      case "last_month": {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return itemDate.getMonth() === lastMonth && itemDate.getFullYear() === lastYear;
      }

      case "this_year":
        return itemDate.getFullYear() === now.getFullYear();

      case "last_year":
        return itemDate.getFullYear() === now.getFullYear() - 1;

      default:
        return true;
    }
  });
}

export function useHistoryFilter(data: QuizHistory[]) {
  const [model,          setModel]          = useState<ViewMode>("grid");
  const [filterTime,     setFilterTime]     = useState<TimeFilter>("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [sort,           setSort]           = useState<SortOrder>("asc");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [inputValue,     setInputValue]     = useState("");

  const handleSearch = () => setSearchQuery(inputValue);

  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.quiztitle.toLowerCase().includes(query) ||
          item.application.toLowerCase().includes(query)
      );
    }

    // Category
    if (filterCategory !== "all") {
      result = result.filter((item) => item.category === filterCategory);
    }

    // Language
    if (filterLanguage !== "all") {
      result = result.filter((item) => item.language === filterLanguage);
    }

    // Time
    result = applyTimeFilter(result, filterTime);

    // Sort by date
    result.sort((a, b) => {
      const da = new Date(a.ended_at).getTime();
      const db = new Date(b.ended_at).getTime();
      return sort === "asc" ? db - da : da - db;
    });

    return result;
  }, [data, searchQuery, filterCategory, filterLanguage, filterTime, sort]);

  const hostData   = filteredData.filter((q) => q.roles.includes("host"));
  const playerData = filteredData.filter((q) => q.roles.includes("player"));

  return {
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
  };
}
