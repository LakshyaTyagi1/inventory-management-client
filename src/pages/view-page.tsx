import { BillingOptionsCard } from "@/components/view-page/billing-options-card";
import { InventoryPoolsCard } from "@/components/view-page/inventory-pools-card";
import { ViewSummaryMetrics } from "@/components/view-page/view-summary-metrics";
import { useViewWorkspace } from "@/components/view-page/view-workspace";
import { isStockTrackingEnabled } from "@/lib/billing-option";

export function ViewPage() {
  const {
    snapshot,
    loading,
    setupEntries,
    inventoryRows,
    todaySalesCount,
    openBillingDialog,
    openInventoryDialog,
  } = useViewWorkspace();

  const recentBillingEntries = setupEntries.slice(0, 3);
  const recentInventoryRows = inventoryRows.slice(0, 3);
  const unlimitedInventoryOfferCount = setupEntries.filter(
    (entry) => !isStockTrackingEnabled(entry.sku.purchaseConstraints),
  ).length;

  return (
    <>
      <ViewSummaryMetrics
        loading={loading}
        productCount={snapshot.products.length}
        billingOptionCount={snapshot.skus.length}
        inventoryPoolCount={inventoryRows.length}
        todaySalesCount={todaySalesCount}
      />

      <section className="grid gap-4">
        <BillingOptionsCard
          entries={recentBillingEntries}
          description={`Showing ${recentBillingEntries.length} recent billing option${recentBillingEntries.length === 1 ? "" : "s"} out of ${setupEntries.length}.`}
          viewAllHref="/view/billing-options"
          onEditBilling={openBillingDialog}
          onEditInventory={openInventoryDialog}
        />
        {inventoryRows.length > 0 ? (
          <InventoryPoolsCard
            rows={recentInventoryRows}
            description={`Showing ${recentInventoryRows.length} recent tracked pool${recentInventoryRows.length === 1 ? "" : "s"} out of ${inventoryRows.length}.${
              unlimitedInventoryOfferCount > 0
                ? ` ${unlimitedInventoryOfferCount} billing option${unlimitedInventoryOfferCount === 1 ? " uses" : "s use"} unlimited inventory.`
                : ""
            }`}
            unlimitedOfferCount={unlimitedInventoryOfferCount}
            viewAllHref="/view/inventory-pools"
            onEditInventory={openInventoryDialog}
          />
        ) : null}
      </section>
    </>
  );
}
