"use client";

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import type { ViewMode } from "../types";

interface ViewToggleProps {
  model: ViewMode;
  onModelChange: (model: ViewMode) => void;
}

function ToggleButton({
  active,
  onClick,
  icon: Icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      onClick={onClick}
      aria-label={label}
      className={cn(
        "h-8 w-8 px-0 transition-all",
        active
          ? "button-orange border-0"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
      )}>
      <Icon className="size-4" />
    </Button>
  );
}

export function ViewToggle({ model, onModelChange }: ViewToggleProps) {
  return (
    <ButtonGroup>
      <ToggleButton
        active={model === "grid"}
        onClick={() => onModelChange("grid")}
        icon={LayoutGrid}
        label="Grid view"
      />
      <ToggleButton
        active={model === "list"}
        onClick={() => onModelChange("list")}
        icon={List}
        label="List view"
      />
    </ButtonGroup>
  );
}
