import { Fragment, useDeferredValue, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { ShoppingCartIcon } from "lucide-react";

import { ViewSearchCard } from "@/components/view-page/view-search-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import {
  formatActivationTimelineValue,
  formatBillingCycleLabel,
  formatPriceLine,
  formatSeatType,
} from "@/lib/catalog";
import { normalizeMoneyAmount } from "@/lib/decimal";
import type { SaleListEntry, Sku } from "@/types";

function formatRecord(record?: Record<string, string>) {
  return record ? Object.entries(record) : [];
}

function formatMinimumUnits(value?: number) {
  return typeof value === "number" ? value.toString() : "Not set";
}

function formatMaximumUnits(value?: number) {
  return typeof value === "number" ? value.toString() : "Unlimited";
}

function getPurchaseTypeLabel(pricingOptions: Sku["pricingOptions"]) {
  if (pricingOptions.some((option) => option.billingCycle !== "one_time")) {
    return "Subscription";
  }

  if (pricingOptions.some((option) => option.billingCycle === "one_time")) {
    return "One-time";
  }

  return undefined;
}

export function SalesPage({
  sales,
  loading,
}: {
  sales: SaleListEntry[];
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [expandedSales, setExpandedSales] = useState<Record<string, boolean>>(
    {},
  );
  const [skuDetailsById, setSkuDetailsById] = useState<Record<string, Sku>>({});
  const [skuLoadStateById, setSkuLoadStateById] = useState<
    Record<string, boolean>
  >({});
  const [skuErrorById, setSkuErrorById] = useState<Record<string, string>>({});
  const deferredQuery = useDeferredValue(query);

  const search = useMemo(
    () =>
      new Fuse(sales, {
        ignoreLocation: true,
        threshold: 0.3,
        keys: [
          { name: "product.name", weight: 0.22 },
          { name: "product.vendor", weight: 0.08 },
          { name: "plan.name", weight: 0.08 },
          { name: "sku.code", weight: 0.12 },
          { name: "sku.region", weight: 0.04 },
          { name: "sale.partner.name", weight: 0.14 },
          { name: "sale.partner.saleReference", weight: 0.12 },
          { name: "sale.customer.name", weight: 0.08 },
          { name: "sale.customer.email", weight: 0.06 },
          { name: "sale.payment.provider", weight: 0.03 },
          { name: "sale.payment.transactionId", weight: 0.03 },
        ],
      }),
    [sales],
  );

  const filteredSales = useMemo(() => {
    const normalizedQuery = deferredQuery.trim();
    if (!normalizedQuery) return sales;

    return search.search(normalizedQuery).map((result) => result.item);
  }, [deferredQuery, sales, search]);

  const loadSkuDetails = async (skuId: string) => {
    if (skuDetailsById[skuId] || skuLoadStateById[skuId]) {
      return;
    }

    setSkuLoadStateById((current) => ({ ...current, [skuId]: true }));
    setSkuErrorById((current) => {
      const next = { ...current };
      delete next[skuId];
      return next;
    });

    try {
      const sku = await api.getSku(skuId);
      setSkuDetailsById((current) =>
        current[skuId] ? current : { ...current, [skuId]: sku },
      );
    } catch (error) {
      setSkuErrorById((current) => ({
        ...current,
        [skuId]:
          error instanceof Error ? error.message : "Failed to load sku details",
      }));
    } finally {
      setSkuLoadStateById((current) => {
        const next = { ...current };
        delete next[skuId];
        return next;
      });
    }
  };

  const toggleExpandedSale = (saleId: string, skuId: string) => {
    const isExpanded = Boolean(expandedSales[saleId]);

    setExpandedSales((current) => {
      if (isExpanded) {
        const next = { ...current };
        delete next[saleId];
        return next;
      }

      return { ...current, [saleId]: true };
    });

    if (!isExpanded) {
      void loadSkuDetails(skuId);
    }
  };

  return (
    <>
      <ViewSearchCard
        title="Browse sales"
        description="Search partner-reported sales by product, SKU code, partner reference, customer, or payment details."
        placeholder="Search by product, sku code, partner, customer, or transaction"
        query={query}
        onQueryChange={setQuery}
        resultCount={filteredSales.length}
        totalCount={sales.length}
        noun="sale record"
      />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Recorded sales</CardTitle>
          <CardDescription>
            Newest partner-reported sales appear first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : filteredSales.length === 0 ? (
            <Empty className="rounded-xl border bg-card px-6 py-10">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShoppingCartIcon />
                </EmptyMedia>
                <EmptyTitle>
                  {sales.length === 0 && !query.trim()
                    ? "No sales recorded"
                    : "No sales matched"}
                </EmptyTitle>
                <EmptyDescription>
                  {sales.length === 0 && !query.trim()
                    ? "Seed or record a partner sale and it will appear here."
                    : "Try a broader search term or clear the current filter."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Sold at</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((entry) => {
                  const additionalInfo = formatRecord(
                    entry.sale.customer.additionalInfo,
                  );
                  const paymentMetadata = formatRecord(
                    entry.sale.payment.metadata,
                  );
                  const isExpanded = Boolean(expandedSales[entry.sale._id]);
                  const skuDetails = skuDetailsById[entry.sale.skuId];
                  const purchaseTypeLabel = skuDetails
                    ? getPurchaseTypeLabel(skuDetails.pricingOptions)
                    : undefined;
                  const isSkuLoading = Boolean(
                    skuLoadStateById[entry.sale.skuId],
                  );
                  const skuError = skuErrorById[entry.sale.skuId];

                  return (
                    <Fragment key={entry.sale._id}>
                      <TableRow
                        data-state={isExpanded ? "expanded" : undefined}
                      >
                        <TableCell className="align-top">
                          <div className="flex min-w-52 flex-col gap-1.5">
                            <span className="font-medium">
                              {entry.product.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {entry.plan.name}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">{entry.sku.code}</Badge>
                              <Badge variant="secondary">
                                {entry.sku.region}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex min-w-44 flex-col gap-1">
                            <span className="font-medium">
                              {entry.sale.partner.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Ref: {entry.sale.partner.saleReference}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex min-w-56 flex-col gap-1">
                            <span className="font-medium">
                              {entry.sale.customer.name}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {entry.sale.customer.email}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {entry.sale.customer.phone}
                            </span>
                            {additionalInfo.length > 0 ? (
                              <div className="pt-1 text-xs text-muted-foreground">
                                {additionalInfo.map(([key, value]) => (
                                  <div key={key}>
                                    {key}: {value}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex min-w-52 flex-col gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">
                                {normalizeMoneyAmount(
                                  entry.sale.payment.amount,
                                ) ?? entry.sale.payment.amount}{" "}
                                {entry.sale.payment.currency}
                              </span>
                              <Badge variant="outline">
                                {entry.sale.payment.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {entry.sale.payment.provider} /{" "}
                              {entry.sale.payment.transactionId}
                            </span>
                            {paymentMetadata.length > 0 ? (
                              <div className="text-xs text-muted-foreground">
                                {paymentMetadata.map(([key, value]) => (
                                  <div key={key}>
                                    {key}: {value}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top font-medium">
                          {entry.sale.quantity}
                        </TableCell>
                        <TableCell className="align-top text-sm text-muted-foreground">
                          {new Date(entry.sale.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            aria-expanded={isExpanded}
                            aria-controls={`sale-details-${entry.sale._id}`}
                            className="mb-1 w-full"
                            aria-label={`${isExpanded ? "Hide" : "Show"} SKU details for ${entry.product.name}`}
                            onClick={() =>
                              toggleExpandedSale(
                                entry.sale._id,
                                entry.sale.skuId,
                              )
                            }
                          >
                            {isExpanded ? "Hide details" : "Show details"}
                          </Button>
                          <br />
                          <Button
                            type="button"
                            variant="default"
                            className="mt-1 w-full"
                          >
                            Update
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded ? (
                        <TableRow id={`sale-details-${entry.sale._id}`}>
                          <TableCell colSpan={7} className="bg-muted/20 py-0">
                            <div className="mx-2 my-3 rounded-xl border bg-background/80 p-4">
                              {isSkuLoading && !skuDetails ? (
                                <div className="flex flex-col gap-3">
                                  <span className="text-sm font-medium">
                                    Loading SKU details...
                                  </span>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                  </div>
                                  <Skeleton className="h-16 w-full" />
                                </div>
                              ) : skuError && !skuDetails ? (
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="font-medium">
                                      SKU details could not be loaded
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {skuError}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      void loadSkuDetails(entry.sale.skuId)
                                    }
                                  >
                                    Retry
                                  </Button>
                                </div>
                              ) : skuDetails ? (
                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                      SKU details
                                    </p>
                                    <Badge variant="outline">
                                      {skuDetails.code}
                                    </Badge>
                                    <Badge variant="outline">
                                      {skuDetails.region}
                                    </Badge>
                                    <Badge
                                      variant={
                                        skuDetails.isBillingDisabled
                                          ? "secondary"
                                          : "outline"
                                      }
                                    >
                                      {skuDetails.isBillingDisabled
                                        ? "Billing disabled"
                                        : "Billing enabled"}
                                    </Badge>
                                    {purchaseTypeLabel ? (
                                      <Badge variant="secondary">
                                        {purchaseTypeLabel}
                                      </Badge>
                                    ) : null}
                                  </div>

                                  <div className="grid gap-3 grid-cols-3">
                                    <div className="grid gap-3">
                                      <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                          Purchase constraints
                                        </p>
                                        <div className="mt-2 space-y-1 text-sm">
                                          <p>
                                            Minimum units:{" "}
                                            {formatMinimumUnits(
                                              skuDetails.purchaseConstraints
                                                ?.minUnits,
                                            )}
                                          </p>
                                          <p>
                                            Maximum units:{" "}
                                            {formatMaximumUnits(
                                              skuDetails.purchaseConstraints
                                                ?.maxUnits,
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="rounded-lg border bg-muted/20 p-3">
                                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                          Activation
                                        </p>
                                        <div className="mt-2 space-y-1 text-sm">
                                          <p>
                                            Timeline:{" "}
                                            {formatActivationTimelineValue(
                                              skuDetails.activationTimeline,
                                            ) ?? "Not set"}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="rounded-lg border bg-muted/20 p-3 col-span-2 h-fit">
                                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Pricing options
                                      </p>
                                      <div className="mt-2 space-y-1 text-sm">
                                        {skuDetails.pricingOptions.map(
                                          (option) => (
                                            <div
                                              key={option.billingCycle}
                                              className="rounded-lg border bg-muted/20 px-3 py-3"
                                            >
                                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="font-medium">
                                                  {formatBillingCycleLabel(
                                                    option.billingCycle,
                                                  )}
                                                </p>
                                                <p className="text-sm text-muted-foreground sm:text-right">
                                                  {formatPriceLine(option)}
                                                </p>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
