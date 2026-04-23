"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { PERIOD_OPTIONS } from "../constants/period-options";
import type { PeriodFilter } from "../types";

interface TimeFilterProps {
  period: PeriodFilter;
  setPeriod: (val: PeriodFilter) => void;
}

export function TimeFilter({ period, setPeriod }: TimeFilterProps) {
  return (
    <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Period" />
      </SelectTrigger>
      <SelectContent>
        {PERIOD_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
