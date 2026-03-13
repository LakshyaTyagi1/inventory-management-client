import type { ProductPricingPlan } from "@/lib/api";
import type {
  BillingCycle,
  PricePerUnit,
  PurchaseConstraints,
  Region,
} from "@/types";

export const billingCycleOptions = [
  { value: "monthly", label: "monthly" },
  { value: "yearly", label: "yearly" },
  { value: "one_time", label: "one time" },
];

export const commonRegionOptions = ["GCC", "INDIA"].map((region) => ({
  value: region,
  label: region,
}));

export function createEmptyPricePerUnit(
  billingCycle: BillingCycle = "monthly",
): PricePerUnit {
  return {
    billingCycle,
    amount: "",
    currency: "USD",
    entity: "",
    ratePeriod: "",
  };
}

export function pricePerUnitFromPlan(plan: ProductPricingPlan): PricePerUnit {
  return {
    billingCycle: suggestedBillingPeriod(plan) ?? "monthly",
    amount:
      plan.isPlanFree || plan.plan.trim().toLowerCase() === "free"
        ? "0"
        : (plan.amount ?? ""),
    currency: plan.currency ?? "USD",
    entity: plan.entity ?? "",
    ratePeriod: plan.period ?? "",
  };
}

export function suggestedBillingPeriod(
  plan: ProductPricingPlan,
): BillingCycle | undefined {
  const normalizedPeriod = plan.period?.trim().toLowerCase();

  if (!normalizedPeriod) return undefined;
  if (normalizedPeriod.startsWith("month")) return "monthly";
  if (
    normalizedPeriod.startsWith("year") ||
    normalizedPeriod === "annual" ||
    normalizedPeriod === "annually"
  ) {
    return "yearly";
  }
  if (normalizedPeriod.startsWith("one") || normalizedPeriod === "lifetime") {
    return "one_time";
  }

  return undefined;
}

export function normalizePricePerUnit(
  pricePerUnit: PricePerUnit,
): PricePerUnit {
  return {
    billingCycle: pricePerUnit.billingCycle,
    amount: pricePerUnit.amount.trim(),
    currency: pricePerUnit.currency.trim().toUpperCase(),
    entity: pricePerUnit.entity?.trim() || undefined,
    ratePeriod: pricePerUnit.ratePeriod?.trim() || undefined,
  };
}

export function normalizePricingOptions(
  pricingOptions: PricePerUnit[],
): PricePerUnit[] {
  return pricingOptions.map((option) => normalizePricePerUnit(option));
}

export function nextPricingCycle(pricingOptions: PricePerUnit[]): BillingCycle {
  const preferredOrder: BillingCycle[] = ["monthly", "yearly", "one_time"];

  return (
    preferredOrder.find(
      (billingCycle) =>
        !pricingOptions.some((option) => option.billingCycle === billingCycle),
    ) ?? "monthly"
  );
}

export function sameLabel(left?: string, right?: string): boolean {
  const normalizedLeft = left?.trim().toLowerCase();
  const normalizedRight = right?.trim().toLowerCase();

  return Boolean(normalizedLeft) && normalizedLeft === normalizedRight;
}

function slugifySkuPart(value?: string): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildSkuCode(input: {
  productName?: string;
  planName?: string;
  region?: string;
}): string {
  const productName = slugifySkuPart(input.productName);
  const planName = slugifySkuPart(input.planName);
  const region = slugifySkuPart(input.region);

  if (!productName || !planName || !region) {
    return "";
  }

  return [productName, planName, region].filter(Boolean).join("-");
}

export function ensureUniqueSkuCode(
  baseCode: string,
  existingCodes: Set<string>,
): string {
  if (!baseCode) return "";
  if (!existingCodes.has(baseCode)) return baseCode;

  let suffix = 2;
  let candidate = `${baseCode}-${suffix}`;

  while (existingCodes.has(candidate)) {
    suffix += 1;
    candidate = `${baseCode}-${suffix}`;
  }

  return candidate;
}

export function normalizeRegion(value: string): Region | undefined {
  return value.trim() ? (value.trim().toUpperCase() as Region) : undefined;
}

export function parsePurchaseConstraints(
  rawValue: string,
): PurchaseConstraints | undefined {
  const raw = rawValue.trim();

  if (!raw) return undefined;

  const bundleMatch = raw.match(/^(\d+)\s*\/\s*then bundles? of\s*(\d+)$/i);
  if (bundleMatch) {
    return {
      raw,
      minUnits: Number(bundleMatch[1]),
      increment: Number(bundleMatch[2]),
    };
  }

  const rangeMatch = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (rangeMatch) {
    return {
      raw,
      minUnits: Number(rangeMatch[1]),
      maxUnits: Number(rangeMatch[2]),
    };
  }

  const openMatch = raw.match(/^(\d+)\s*\/\s*as many needed$/i);
  if (openMatch) {
    return {
      raw,
      minUnits: Number(openMatch[1]),
    };
  }

  const singleMatch = raw.match(/^(\d+)$/);
  if (singleMatch) {
    const value = Number(singleMatch[1]);
    return {
      raw,
      minUnits: value,
      maxUnits: value,
    };
  }

  return { raw };
}
