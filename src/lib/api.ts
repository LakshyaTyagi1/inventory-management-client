import type {
  DashboardSnapshot,
  Plan,
  PricePerUnit,
  PurchaseConstraints,
  Product,
  Sku,
  SkuCatalogEntry,
} from "../types";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";
const searchApiBaseUrl = import.meta.env.VITE_SEARCH_API_URL?.trim();
const searchApiKey = import.meta.env.VITE_SEARCH_API_KEY?.trim();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "content-type": "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response
      .json()
      .catch(() => ({ message: "request failed" }))) as { message?: string };
    throw new Error(payload.message ?? "request failed");
  }

  return response.json() as Promise<T>;
}

export type ProductSearchResult = {
  id: string;
  slug: string;
  name: string;
  vendor: string;
  description: string;
  logoUrl: string;
};

export type ProductPricingPlan = {
  plan: string;
  amount?: string;
  currency?: string;
  entity?: string;
  period?: string;
  description?: string[];
  updated_on?: string;
  isPlanFree?: boolean;
};

export type CatalogEntryResponse = {
  product: Product;
  plan: Plan;
  sku: Sku;
};

type SearchApiProductResult = {
  product_name: string;
  company: string;
  logo_url?: string;
  overview?: string;
  weburl: string;
  category?: Array<{ name: string }>;
};

type SearchApiResponse = {
  message?: string;
  data?: {
    products?: SearchApiProductResult[];
  };
};

const zoftwareBaseUrl = "https://api.zoftwarehub.com";

export const api = {
  getDashboard: () => request<DashboardSnapshot>("/api/dashboard"),
  getSkus: () => request<SkuCatalogEntry[]>("/api/skus"),
  searchProducts: async (
    query: string,
    limit = 6,
  ): Promise<ProductSearchResult[]> => {
    if (!searchApiBaseUrl || !searchApiKey) {
      throw new Error("search api is not configured");
    }

    const response = await fetch(
      `${searchApiBaseUrl.replace(/\/+$/, "")}/api/v1/search/${encodeURIComponent(query)}?productLimit=${limit}`,
      {
        headers: {
          "X-API-Key": searchApiKey,
          accept: "application/json",
        },
      },
    );
    const json = (await response
      .json()
      .catch(() => ({
        message: "product search failed",
      }))) as SearchApiResponse;

    if (!response.ok) {
      throw new Error(json.message ?? "product search failed");
    }

    return (json.data?.products ?? []).map((item) => ({
      id: item.weburl,
      slug: item.weburl,
      name: item.product_name,
      vendor: item.company,
      description:
        item.overview?.trim() ||
        item.category?.map((category) => category.name).join(", ") ||
        "",
      logoUrl: item.logo_url ?? "",
    }));
  },
  getProductPricing: async (
    productSlug: string,
  ): Promise<ProductPricingPlan[]> => {
    const response = await fetch(
      `${zoftwareBaseUrl}/api/v1/product/get-product-details?name=${encodeURIComponent(productSlug)}&tab=pricing&region=global`,
    );
    if (!response.ok) return [];
    const json = (await response.json()) as {
      data?: { pricing?: ProductPricingPlan[] };
    };
    const plans = (json.data?.pricing ?? []).filter((p) => p.plan?.trim());
    // deduplicate by plan name
    return plans.filter(
      (p, i) => plans.findIndex((x) => x.plan === p.plan) === i,
    );
  },
  addCatalogEntry: (payload: {
    product: {
      externalId: string;
      name: string;
      vendor: string;
      description: string;
      logoUrl: string;
    };
    plan: { name: string; planType: "standard" | "enterprise" };
    sku: {
      code: string;
      region: "GCC" | "INDIA";
      seatType: "seat" | "license_key";
      pricingOptions: PricePerUnit[];
      purchaseConstraints?: PurchaseConstraints;
      activationTimeline?: string;
    };
  }) =>
    request<CatalogEntryResponse>("/api/catalog/entries", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createPlan: (payload: {
    productId: string;
    name: string;
    planType: "standard" | "enterprise";
  }) =>
    request<Plan>("/api/plans", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createSku: (payload: {
    planId: string;
    code: string;
    region: "GCC" | "INDIA";
    seatType: "seat" | "license_key";
    pricingOptions: PricePerUnit[];
    purchaseConstraints?: PurchaseConstraints;
    activationTimeline?: string;
  }) =>
    request<Sku>("/api/skus", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateSku: (
    skuId: string,
    payload: {
      code: string;
      region: "GCC" | "INDIA";
      seatType: "seat" | "license_key";
      pricingOptions: PricePerUnit[];
      purchaseConstraints?: PurchaseConstraints;
      activationTimeline?: string;
    },
  ) =>
    request<Sku>(`/api/skus/${skuId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  createInventoryPool: (payload: { skuId: string; totalQuantity: number }) =>
    request("/api/inventory-pools", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  adjustInventory: (payload: {
    skuId: string;
    change: number;
    reason:
      | "MANUAL_ADD"
      | "MANUAL_REMOVE"
      | "EXTERNAL_VENDOR_SALE"
      | "REFUND"
      | "CORRECTION";
    actor: string;
  }) =>
    request("/api/inventory-adjustments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
