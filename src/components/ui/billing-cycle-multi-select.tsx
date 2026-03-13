import { useMemo } from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";

import {
  billingCycleOptions,
  orderBillingCycles,
  toggleBillingCycleSelection,
} from "@/lib/billing-option";
import { formatBillingCycleLabel } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/types";

import { Badge } from "./badge";

export function BillingCycleMultiSelect({
  value,
  onChange,
  disabled,
  placeholder = "Select billing cycles",
}: {
  value: BillingCycle[];
  onChange: (value: BillingCycle[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const selectedBillingCycles = useMemo(
    () => orderBillingCycles(value),
    [value],
  );

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Billing cycles"
          aria-haspopup="listbox"
          data-slot="billing-cycle-trigger"
          disabled={disabled}
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm transition-[border-color,background-color,color,box-shadow] outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-ring data-[state=open]:bg-accent/40",
            selectedBillingCycles.length === 0 && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {selectedBillingCycles.length > 0 ? (
              selectedBillingCycles.map((billingCycle) => (
                <Badge key={billingCycle} variant="outline">
                  {formatBillingCycleLabel(billingCycle)}
                </Badge>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-[var(--radix-popover-trigger-width)] rounded-lg border bg-popover p-1 text-popover-foreground ring-1 ring-foreground/10 outline-none duration-100 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <div className="px-2 py-1 text-xs text-muted-foreground">
            Monthly and yearly can be combined. One time stays exclusive.
          </div>

          <div role="listbox" aria-label="Billing cycles options">
            {billingCycleOptions.map((option) => {
              const billingCycle = option.value as BillingCycle;
              const selected = selectedBillingCycles.includes(billingCycle);

              return (
                <button
                  key={billingCycle}
                  type="button"
                  role="option"
                  aria-label={option.label}
                  aria-selected={selected}
                  data-slot="billing-cycle-option"
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                    selected && "bg-accent/60",
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
                  <span className="flex size-4 items-center justify-center">
                    <CheckIcon
                      className={cn(
                        "size-4",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </span>
                  <span>{option.label}</span>
                  {billingCycle === "one_time" ? (
                    <span className="ml-auto text-xs text-muted-foreground">
                      exclusive
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
