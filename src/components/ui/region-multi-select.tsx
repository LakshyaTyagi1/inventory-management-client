import { useMemo } from "react";
import { CheckIcon } from "lucide-react";

import {
  commonRegionOptions,
  orderRegions,
  toggleRegionSelection,
} from "@/lib/billing-option";
import { cn } from "@/lib/utils";
import type { Region } from "@/types";

export function RegionMultiSelect({
  value,
  onChange,
  disabled,
}: {
  value: Region[];
  onChange: (value: Region[]) => void;
  disabled?: boolean;
}) {
  const selectedRegions = useMemo(() => orderRegions(value), [value]);

  return (
    <div
      role="group"
      aria-label="Offer regions"
      className="grid gap-2 sm:grid-cols-2"
    >
      {commonRegionOptions.map((option) => {
        const region = option.value as Region;
        const selected = selectedRegions.includes(region);

        return (
          <button
            key={region}
            type="button"
            aria-label={option.label}
            aria-pressed={selected}
            data-slot="region-option"
            disabled={disabled}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-[border-color,background-color,color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-input bg-background hover:bg-muted/40",
            )}
            onClick={() => {
              onChange(toggleRegionSelection(selectedRegions, region));
            }}
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                selected
                  ? "border-[#0A6C31] bg-[#0A6C31]"
                  : "border-muted-foreground/40",
              )}
            >
              <CheckIcon
                strokeWidth={3}
                className={cn(
                  "size-3.5 text-white",
                  selected ? "opacity-100" : "opacity-0",
                )}
              />
            </span>
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
