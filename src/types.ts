export type Region = "GCC" | "INDIA";
export type BillingCycle = "monthly" | "yearly" | "one_time";

export type Product = {
  _id: string;
  externalId: string;
  name: string;
  vendor: string;
  description: string;
  logoUrl: string;
  createdAt: string;
};

export type Plan = {
  _id: string;
  productId: string;
  name: string;
  planType: "standard" | "enterprise";
  createdAt: string;
};

export type PricePerUnit = {
  billingCycle: BillingCycle;
  amount: string;
  currency: string;
  entity?: string;
  ratePeriod?: string;
};

export type PricingDetails = {
  amount: string;
  currency: string;
  entity: string;
  ratePeriod: string;
};

export type PricingDetailsByCycle = Record<BillingCycle, PricingDetails>;

export type PurchaseConstraints = {
  minUnits?: number;
  maxUnits?: number;
};

export type Sku = {
  _id: string;
  planId: string;
  code: string;
  region: Region;
  seatType: "seat" | "license_key";
  pricingOptions: PricePerUnit[];
  purchaseConstraints?: PurchaseConstraints;
  activationTimeline?: string;
  createdAt: string;
};

export type InventoryPool = {
  _id: string;
  skuId: string;
  totalQuantity: number;
  updatedAt: string;
};

export type AuditLog = {
  _id: string;
  action: string;
  actor: string;
  timestamp: string;
};

export type DashboardSnapshot = {
  products: Product[];
  plans: Plan[];
  skus: Sku[];
  inventoryPools: InventoryPool[];
  auditLogs: AuditLog[];
};

export type SkuCatalogEntry = {
  sku: Sku;
  plan: Plan;
  product: Product;
};
