import { BoxesIcon } from "lucide-react";

import { InventoryStockFields } from "@/components/inventory-stock-fields";
import { FieldGroup } from "@/components/ui/field";
import type { InventoryPool, Region } from "@/types";

import { SetupStepCard } from "./setup-step-card";

function joinValues(values: string[]) {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0]!;
  if (values.length === 2) return `${values[0]} and ${values[1]}`;

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

export function StockStep({
  detailsReady,
  entries,
  onInventoryQuantityChange,
  onInventoryActorChange,
}: {
  detailsReady: boolean;
  entries: Array<{
    region: Region;
    stockTrackingEnabled: boolean;
    existingInventoryPool?: InventoryPool;
    inventoryQuantity: number;
    inventoryActor: string;
  }>;
  onInventoryQuantityChange: (region: Region, value: number) => void;
  onInventoryActorChange: (region: Region, value: string) => void;
}) {
  const cappedEntries = entries.filter((entry) => entry.stockTrackingEnabled);
  const unlimitedRegions = entries
    .filter((entry) => !entry.stockTrackingEnabled)
    .map((entry) => entry.region);
  const hasMultipleRegions = entries.length > 1;

  return (
    <SetupStepCard
      step={3}
      icon={BoxesIcon}
      title="Set starting stock"
      description="Track stock separately for each selected region that has a maximum unit cap. Regions set to Unlimited skip stock tracking."
    >
      {detailsReady ? (
        <div className="space-y-4">
          {cappedEntries.length > 0 ? (
            cappedEntries.map((entry) => (
              <section
                key={entry.region}
                role="region"
                aria-label={`${entry.region} stock`}
                className="rounded-lg border p-4"
              >
                {hasMultipleRegions ? (
                  <div className="mb-4">
                    <h4 className="font-medium">{entry.region}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track stock separately for this regional offer.
                    </p>
                  </div>
                ) : null}

                <FieldGroup>
                  <InventoryStockFields
                    quantityLabel={
                      entry.existingInventoryPool
                        ? "Stock total"
                        : "Starting stock"
                    }
                    quantityDescription={
                      entry.existingInventoryPool
                        ? "Enter the total stock you want on hand. We will add or remove the difference automatically."
                        : "Leave 0 if you want to save the regional offer first and track stock later."
                    }
                    quantity={entry.inventoryQuantity}
                    onQuantityChange={(value) =>
                      onInventoryQuantityChange(entry.region, value)
                    }
                    region={entry.region}
                    regionDescription="Stock is attached directly to this regional offer."
                    actor={
                      entry.existingInventoryPool
                        ? entry.inventoryActor
                        : undefined
                    }
                    onActorChange={
                      entry.existingInventoryPool
                        ? (value) => onInventoryActorChange(entry.region, value)
                        : undefined
                    }
                    actorDescription="Used only when the stock total changes."
                    existingInventory={
                      entry.existingInventoryPool
                        ? {
                            totalQuantity:
                              entry.existingInventoryPool.totalQuantity,
                          }
                        : undefined
                    }
                  />
                </FieldGroup>
              </section>
            ))
          ) : (
            <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
              Starting stock is only available for regions with a maximum unit
              cap. {joinValues(unlimitedRegions)}{" "}
              {unlimitedRegions.length === 1 ? "is" : "are"} currently set to
              Unlimited.
            </p>
          )}

          {cappedEntries.length > 0 && unlimitedRegions.length > 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
              Stock is hidden for {joinValues(unlimitedRegions)} because maximum
              units is set to Unlimited.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Choose at least one regional offer first. Stock only appears for
          regions with a maximum unit cap.
        </p>
      )}
    </SetupStepCard>
  );
}
