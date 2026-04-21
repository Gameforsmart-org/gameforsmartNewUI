"use client";

import { Search } from "lucide-react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ViewToggle } from "./view-toggle";
import {
  TIME_OPTIONS,
  CATEGORY_OPTIONS,
  LANGUAGE_OPTIONS
} from "../constants/filter-options";
import type { ViewMode, SortOrder, TimeFilter } from "../types";

interface HistoryFiltersProps {
  model: ViewMode;
  onModelChange: (m: ViewMode) => void;
  sort: SortOrder;
  onSortChange: (s: SortOrder) => void;
  filterTime: TimeFilter;
  onFilterTimeChange: (v: TimeFilter) => void;
  filterCategory: string;
  onFilterCategoryChange: (v: string) => void;
  filterLanguage: string;
  onFilterLanguageChange: (v: string) => void;
  inputValue: string;
  onInputChange: (v: string) => void;
  onSearch: () => void;
}

export function HistoryFilters({
  model, onModelChange,
  sort, onSortChange,
  filterTime, onFilterTimeChange,
  filterCategory, onFilterCategoryChange,
  filterLanguage, onFilterLanguageChange,
  inputValue, onInputChange,
  onSearch
}: HistoryFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      {/* View toggle — hidden on mobile (shown in tab row) */}
      <div className="hidden sm:flex">
        <ViewToggle model={model} onModelChange={onModelChange} />
      </div>

      {/* Sort */}
      <Button variant="outline" onClick={() => onSortChange(sort === "asc" ? "desc" : "asc")}>
        <ArrowUpDown />
      </Button>

      {/* Time filter */}
      <Select value={filterTime} onValueChange={(v) => onFilterTimeChange(v as TimeFilter)}>
        <SelectTrigger className="input h-8 w-[140px] text-xs font-semibold">
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent>
          {TIME_OPTIONS.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Category filter */}
      <Select value={filterCategory} onValueChange={onFilterCategoryChange}>
        <SelectTrigger className="input h-8 w-[140px] text-xs font-semibold">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          {CATEGORY_OPTIONS.map((cat) => (
            <SelectItem key={cat.value} value={cat.value}>
              {cat.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Language filter */}
      <Select value={filterLanguage} onValueChange={onFilterLanguageChange}>
        <SelectTrigger className="input h-8 w-[140px] text-xs font-semibold">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Search */}
      <div className="relative w-full sm:w-auto">
        <Input
          placeholder="Cari history..."
          className="input h-8 w-full pr-20 pl-3 sm:w-[220px] text-xs"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
        />
        <Button
          variant="default"
          className="button-orange absolute top-1 right-1 h-6 w-6 p-1.5"
          onClick={onSearch}>
          <Search size={14} />
        </Button>
      </div>
    </div>
  );
}
