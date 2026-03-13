import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { BoxesIcon } from "lucide-react";

import { InventoryPoolsCard } from "@/components/view-page/inventory-pools-card";
import { ViewSearchCard } from "@/components/view-page/view-search-card";
import { useViewWorkspace } from "@/components/view-page/view-workspace";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function InventoryPoolsPage() {
  const { inventoryRows, openInventoryDialog } = useViewWorkspace();
  const [query, setQuery] = useState("");

  const search = useMemo(
    () =>
      new Fuse(inventoryRows, {
        ignoreLocation: true,
        threshold: 0.3,
        keys: [
          { name: "product.name", weight: 0.35 },
          { name: "plan.name", weight: 0.2 },
          { name: "sku.code", weight: 0.2 },
          { name: "sku.region", weight: 0.2 },
          { name: "sku.pricingOptions.billingCycle", weight: 0.05 },
        ],
      }),
    [inventoryRows],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return inventoryRows;

    return search.search(normalizedQuery).map((result) => result.item);
  }, [inventoryRows, query, search]);

  return (
    <>
      <ViewSearchCard
        title="Browse inventory pools"
        description="Search every tracked stock pool by product, plan, billing code, or region."
        placeholder="Search by product, plan, code, or region"
        query={query}
        onQueryChange={setQuery}
        resultCount={filteredRows.length}
        totalCount={inventoryRows.length}
        noun="inventory pool"
      />

      {filteredRows.length === 0 ? (
        <Empty className="rounded-xl border bg-card px-6 py-10">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BoxesIcon />
            </EmptyMedia>
            <EmptyTitle>No inventory pools matched</EmptyTitle>
            <EmptyDescription>
              Try a broader search term or return to the view overview.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <InventoryPoolsCard
          rows={filteredRows}
          description={`Showing ${filteredRows.length} of ${inventoryRows.length} inventory pool${inventoryRows.length === 1 ? "" : "s"}.`}
          onEditInventory={openInventoryDialog}
        />
      )}
    </>
  );
}
