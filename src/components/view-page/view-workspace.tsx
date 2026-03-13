import { useEffect, useMemo, useState } from "react";
import { Outlet, useOutletContext } from "react-router-dom";

import type { ActionRunner } from "@/components/operations-app";
import { EditBillingDialog } from "@/components/view-page/edit-billing-dialog";
import { EditInventoryDialog } from "@/components/view-page/edit-inventory-dialog";
import type {
  InventoryRowEntry,
  ViewSetupEntry,
} from "@/components/view-page/types";
import {
  buildSkuCode,
  createEmptyPricePerUnit,
  ensureUniqueSkuCode,
  nextPricingCycle,
  normalizePricingOptions,
  normalizeRegion,
  parsePurchaseConstraints,
} from "@/lib/billing-option";
import { buildInventoryRows, buildViewSetupEntries } from "@/lib/view-data";
import { api } from "@/lib/api";
import type { DashboardSnapshot, PricePerUnit, Sku } from "@/types";

type InventoryDialogTarget = {
  skuId: string;
  poolId?: string;
};

type ViewWorkspaceContextValue = {
  snapshot: DashboardSnapshot;
  loading: boolean;
  setupEntries: ViewSetupEntry[];
  inventoryRows: InventoryRowEntry[];
  openBillingDialog: (skuId: string) => void;
  openInventoryDialog: (input: InventoryDialogTarget) => void;
};

export function ViewWorkspace({
  snapshot,
  loading,
  runAction,
}: {
  snapshot: DashboardSnapshot;
  loading: boolean;
  runAction: ActionRunner;
}) {
  const [billingDialogSkuId, setBillingDialogSkuId] = useState<string | null>(
    null,
  );
  const [billingRegion, setBillingRegion] = useState("");
  const [billingPricingOptions, setBillingPricingOptions] = useState<
    PricePerUnit[]
  >([createEmptyPricePerUnit()]);
  const [purchaseConstraintsRaw, setPurchaseConstraintsRaw] = useState("");
  const [activationTimeline, setActivationTimeline] = useState("");
  const [inventoryDialogTarget, setInventoryDialogTarget] =
    useState<InventoryDialogTarget | null>(null);
  const [inventoryQuantity, setInventoryQuantity] = useState(0);
  const [inventoryActor, setInventoryActor] = useState("operations");

  const setupEntries = useMemo(
    () => buildViewSetupEntries(snapshot),
    [snapshot],
  );
  const inventoryRows = useMemo(() => buildInventoryRows(snapshot), [snapshot]);

  const activeBillingEntry = useMemo(
    () =>
      billingDialogSkuId
        ? (setupEntries.find((entry) => entry.sku._id === billingDialogSkuId) ??
          null)
        : null,
    [billingDialogSkuId, setupEntries],
  );

  const activeInventoryEntry = useMemo(
    () =>
      inventoryDialogTarget
        ? (setupEntries.find(
            (entry) => entry.sku._id === inventoryDialogTarget.skuId,
          ) ?? null)
        : null,
    [inventoryDialogTarget, setupEntries],
  );

  const activeInventoryPool = useMemo(() => {
    if (!inventoryDialogTarget) return null;
    if (inventoryDialogTarget.poolId) {
      return (
        snapshot.inventoryPools.find(
          (pool) => pool._id === inventoryDialogTarget.poolId,
        ) ?? null
      );
    }

    return activeInventoryEntry?.pools[0] ?? null;
  }, [activeInventoryEntry, inventoryDialogTarget, snapshot.inventoryPools]);

  useEffect(() => {
    if (!activeBillingEntry) return;

    setBillingRegion(activeBillingEntry.sku.region);
    setBillingPricingOptions(
      activeBillingEntry.sku.pricingOptions.length > 0
        ? activeBillingEntry.sku.pricingOptions
        : [createEmptyPricePerUnit()],
    );
    setPurchaseConstraintsRaw(
      activeBillingEntry.sku.purchaseConstraints?.raw ?? "",
    );
    setActivationTimeline(activeBillingEntry.sku.activationTimeline ?? "");
  }, [activeBillingEntry]);

  useEffect(() => {
    if (!inventoryDialogTarget) return;

    setInventoryQuantity(activeInventoryPool?.totalQuantity ?? 0);
    setInventoryActor("operations");
  }, [activeInventoryPool, inventoryDialogTarget]);

  const normalizedBillingRegion = normalizeRegion(billingRegion);
  const generatedBillingCode = useMemo(() => {
    if (!activeBillingEntry) return "";

    return ensureUniqueSkuCode(
      buildSkuCode({
        productName: activeBillingEntry.product.name,
        planName: activeBillingEntry.plan.name,
        region: normalizedBillingRegion,
      }),
      new Set(
        snapshot.skus
          .filter((sku) => sku._id !== activeBillingEntry.sku._id)
          .map((sku) => sku.code),
      ),
    );
  }, [activeBillingEntry, normalizedBillingRegion, snapshot.skus]);

  const normalizedBillingPricingOptions = useMemo(
    () => normalizePricingOptions(billingPricingOptions),
    [billingPricingOptions],
  );

  const billingHasPricing =
    Boolean(normalizedBillingRegion) &&
    normalizedBillingPricingOptions.length > 0 &&
    normalizedBillingPricingOptions.every(
      (pricingOption) =>
        pricingOption.amount.length > 0 && pricingOption.currency.length > 0,
    ) &&
    new Set(
      normalizedBillingPricingOptions.map(
        (pricingOption) => pricingOption.billingCycle,
      ),
    ).size === normalizedBillingPricingOptions.length;
  const currentBillingPricingOptions = useMemo(
    () => normalizePricingOptions(activeBillingEntry?.sku.pricingOptions ?? []),
    [activeBillingEntry],
  );
  const billingChanged =
    !!activeBillingEntry &&
    (activeBillingEntry.sku.region !== normalizedBillingRegion ||
      activeBillingEntry.sku.code !== generatedBillingCode ||
      JSON.stringify(currentBillingPricingOptions) !==
        JSON.stringify(normalizedBillingPricingOptions) ||
      (activeBillingEntry.sku.purchaseConstraints?.raw ?? "") !==
        purchaseConstraintsRaw.trim() ||
      (activeBillingEntry.sku.activationTimeline ?? "") !==
        activationTimeline.trim());

  const activeInventoryRegion = activeInventoryEntry?.sku.region ?? "";
  const inventoryChanged =
    activeInventoryPool?.totalQuantity !== undefined
      ? inventoryQuantity !== activeInventoryPool.totalQuantity
      : inventoryQuantity > 0;

  const updateBillingPricingOption = (
    index: number,
    field: keyof PricePerUnit,
    value: string,
  ) => {
    setBillingPricingOptions((current) =>
      current.map((pricingOption, currentIndex) =>
        currentIndex === index
          ? {
              ...pricingOption,
              [field]: value,
            }
          : pricingOption,
      ),
    );
  };

  const addBillingPricingOption = () => {
    setBillingPricingOptions((current) => [
      ...current,
      createEmptyPricePerUnit(nextPricingCycle(current)),
    ]);
  };

  const removeBillingPricingOption = (index: number) => {
    setBillingPricingOptions((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const closeBillingDialog = () => setBillingDialogSkuId(null);
  const closeInventoryDialog = () => setInventoryDialogTarget(null);

  return (
    <>
      <Outlet
        context={{
          snapshot,
          loading,
          setupEntries,
          inventoryRows,
          openBillingDialog: setBillingDialogSkuId,
          openInventoryDialog: setInventoryDialogTarget,
        }}
      />

      <EditBillingDialog
        entry={activeBillingEntry}
        open={Boolean(activeBillingEntry)}
        onOpenChange={(open) => {
          if (!open) closeBillingDialog();
        }}
        region={billingRegion}
        onRegionChange={setBillingRegion}
        generatedCode={generatedBillingCode}
        pricingOptions={billingPricingOptions}
        onPricingOptionChange={updateBillingPricingOption}
        onAddPricingOption={addBillingPricingOption}
        onRemovePricingOption={removeBillingPricingOption}
        purchaseConstraints={purchaseConstraintsRaw}
        onPurchaseConstraintsChange={setPurchaseConstraintsRaw}
        activationTimeline={activationTimeline}
        onActivationTimelineChange={setActivationTimeline}
        canSave={billingHasPricing && billingChanged}
        loading={loading}
        onSave={() => {
          if (!activeBillingEntry || !normalizedBillingRegion) return;

          void runAction(
            () =>
              api.updateSku(activeBillingEntry.sku._id, {
                code: generatedBillingCode,
                region: normalizedBillingRegion,
                seatType: activeBillingEntry.sku.seatType,
                pricingOptions: normalizedBillingPricingOptions,
                purchaseConstraints: parsePurchaseConstraints(
                  purchaseConstraintsRaw,
                ),
                activationTimeline: activationTimeline.trim() || undefined,
              }),
            "Regional offer updated.",
          ).then((ok) => {
            if (ok) closeBillingDialog();
          });
        }}
      />

      <EditInventoryDialog
        entry={activeInventoryEntry}
        pool={activeInventoryPool}
        open={Boolean(activeInventoryEntry)}
        onOpenChange={(open) => {
          if (!open) closeInventoryDialog();
        }}
        quantity={inventoryQuantity}
        onQuantityChange={setInventoryQuantity}
        region={activeInventoryRegion}
        actor={inventoryActor}
        onActorChange={setInventoryActor}
        canSave={inventoryChanged}
        loading={loading}
        onSave={() => {
          if (!activeInventoryEntry) return;

          const work = activeInventoryPool
            ? () =>
                api.adjustInventory({
                  skuId: activeInventoryEntry.sku._id,
                  change: inventoryQuantity - activeInventoryPool.totalQuantity,
                  reason:
                    inventoryQuantity >= activeInventoryPool.totalQuantity
                      ? "MANUAL_ADD"
                      : "MANUAL_REMOVE",
                  actor: inventoryActor.trim() || "operations",
                })
            : () =>
                api.createInventoryPool({
                  skuId: activeInventoryEntry.sku._id,
                  totalQuantity: inventoryQuantity,
                });

          void runAction(
            work,
            activeInventoryPool
              ? "Inventory updated."
              : "Inventory tracking started.",
          ).then((ok) => {
            if (ok) closeInventoryDialog();
          });
        }}
      />
    </>
  );
}

export function useViewWorkspace() {
  return useOutletContext<ViewWorkspaceContextValue>();
}
