import { describe, expect, it } from "vitest";

import { buildSkuCatalogLookup } from "@/lib/catalog";
import type { DashboardSnapshot, PricePerUnit } from "@/types";

import {
  buildSetupPageDerivedState,
  createRegionDraft,
  regionDraftFromExisting,
} from "../setup-page-model";

const pricingOption = (
  billingCycle: PricePerUnit["billingCycle"],
  amount: string,
  currency = "USD",
  entity = "user",
  ratePeriod = billingCycle === "yearly" ? "year" : billingCycle,
): PricePerUnit => ({
  billingCycle,
  amount,
  currency,
  entity,
  ratePeriod,
});

const snapshot: DashboardSnapshot = {
  products: [
    {
      _id: "product-1",
      externalId: "jira-product-1",
      name: "Jira",
      vendor: "Atlassian",
      description: "Project tracking",
      logoUrl: "",
      createdAt: "2026-03-12T00:00:00.000Z",
    },
  ],
  plans: [
    {
      _id: "plan-1",
      productId: "product-1",
      name: "Standard",
      planType: "standard",
      createdAt: "2026-03-12T00:00:00.000Z",
    },
  ],
  skus: [
    {
      _id: "sku-1",
      planId: "plan-1",
      code: "jira-standard-gcc",
      region: "GCC",
      seatType: "seat",
      pricingOptions: [pricingOption("monthly", "18")],
      purchaseConstraints: { minUnits: 1 },
      activationTimeline: "5 Days",
      createdAt: "2026-03-12T00:00:00.000Z",
    },
  ],
  inventoryPools: [
    {
      _id: "pool-1",
      skuId: "sku-1",
      totalQuantity: 12,
      updatedAt: "2026-03-12T00:00:00.000Z",
    },
  ],
  auditLogs: [],
};

const selectedProduct = {
  id: "jira-product-1",
  slug: "jira",
  name: "Jira",
  vendor: "Atlassian",
  description: "Project tracking",
  logoUrl: "",
};

describe("setup page model", () => {
  it("summarizes mixed create, update, and stock actions", () => {
    const existingDraft = {
      ...regionDraftFromExisting(snapshot.skus[0]!, 12),
      pricingDetails: {
        amount: "21",
        currency: "USD",
        entity: "user",
        ratePeriod: "monthly",
      },
      inventoryQuantity: 18,
    };
    const indiaDraft = {
      ...createRegionDraft(pricingOption("monthly", "1400", "INR")),
      pricingDetails: {
        amount: "1400",
        currency: "INR",
        entity: "user",
        ratePeriod: "month",
      },
      inventoryQuantity: 5,
    };

    const derived = buildSetupPageDerivedState({
      snapshot,
      skuCatalog: buildSkuCatalogLookup(snapshot),
      selectedProduct,
      pricingPlans: [],
      planName: "Standard",
      selectedRegions: ["GCC", "INDIA"],
      activeRegion: "GCC",
      regionDrafts: {
        GCC: existingDraft,
        INDIA: indiaDraft,
      },
      loadingPricing: false,
      loading: false,
    });

    expect(derived.existingProduct?._id).toBe("product-1");
    expect(derived.existingPlan?._id).toBe("plan-1");
    expect(derived.existingRegions).toEqual(["GCC"]);
    expect(derived.recentSetups).toHaveLength(1);
    expect(derived.regionEntries).toHaveLength(2);
    expect(derived.activeRegionEntry?.generatedSkuCode).toBe(
      "jira-standard-gcc",
    );
    expect(
      derived.regionEntries.find((entry) => entry.region === "INDIA")
        ?.generatedSkuCode,
    ).toBe("jira-standard-india");

    expect(derived.summary.createOfferCount).toBe(1);
    expect(derived.summary.updateOfferCount).toBe(1);
    expect(derived.summary.startTrackingCount).toBe(1);
    expect(derived.summary.adjustStockCount).toBe(1);
    expect(derived.summary.canSubmit).toBe(true);
    expect(derived.summary.submitLabel).toBe("Save selected regions");
    expect(derived.summary.successMessage).toBe(
      "Regional offers and stock saved.",
    );
    expect(derived.summary.saveMessage).toBe(
      "Saving will create 1 new regional offer, update 1 existing regional offer, start tracking stock in 1 region, and adjust stock in 1 region.",
    );
  });

  it("blocks saving when an existing regional offer is edited into an invalid state", () => {
    const invalidDraft = {
      ...regionDraftFromExisting(snapshot.skus[0]!, 12),
      pricingDetails: {
        amount: "",
        currency: "USD",
        entity: "user",
        ratePeriod: "monthly",
      },
    };

    const derived = buildSetupPageDerivedState({
      snapshot,
      skuCatalog: buildSkuCatalogLookup(snapshot),
      selectedProduct,
      pricingPlans: [],
      planName: "Standard",
      selectedRegions: ["GCC"],
      activeRegion: "GCC",
      regionDrafts: {
        GCC: invalidDraft,
      },
      loadingPricing: false,
      loading: false,
    });

    expect(derived.summary.blockingRegions).toEqual(["GCC"]);
    expect(derived.summary.canSubmit).toBe(false);
    expect(derived.summary.saveMessage).toBe(
      "Complete the GCC tab before saving.",
    );
  });
});
