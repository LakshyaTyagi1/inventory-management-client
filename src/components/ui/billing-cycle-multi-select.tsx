import { useMemo } from "react";
import { CheckIcon } from "lucide-react";

import {
  billingCycleOptions,
  orderBillingCycles,
  toggleBillingCycleSelection,
} from "@/lib/billing-option";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/types";

export function BillingCycleMultiSelect({
  value,
  onChange,
  disabled,
}: {
  value: BillingCycle[];
  onChange: (value: BillingCycle[]) => void;
  disabled?: boolean;
}) {
  const selectedBillingCycles = useMemo(
    () => orderBillingCycles(value),
    [value],
  );

  return (
    <div
      role="group"
      aria-label="Billing cycles"
      className="grid gap-2 sm:grid-cols-3"
    >
      {billingCycleOptions.map((option) => {
        const billingCycle = option.value as BillingCycle;
        const selected = selectedBillingCycles.includes(billingCycle);

        return (
          <button
            key={billingCycle}
            type="button"
            aria-label={option.label}
            aria-pressed={selected}
            data-slot="billing-cycle-option"
            disabled={disabled}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-[border-color,background-color,color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-secondary bg-secondary text-secondary-foreground"
                : "border-input bg-background hover:bg-muted/40",
            )}
            onClick={() => {
              onChange(
                toggleBillingCycleSelection(
                  selectedBillingCycles,
                  billingCycle,
                ),
              );
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
            <span className="flex flex-col items-start gap-1">
              <span className="leading-none">{option.label}</span>
              {billingCycle === "one_time" ? (
                <span
                  className={cn(
                    "text-xs transition-colors",
                    selected
                      ? "text-secondary-foreground/60"
                      : "text-muted-foreground",
                  )}
                >
                  exclusive
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
