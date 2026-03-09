import { useEffect, useState } from "react";
import { BoxesIcon, Building2Icon, Layers3Icon, PackageIcon } from "lucide-react";

import type { DashboardSnapshot, Sku } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { api } from "@/lib/api";
import type { ActionRunner } from "@/components/operations-app";

const regions = ["GLOBAL", "US", "EU", "INDIA", "APAC"] as const;

export function CatalogPage({
  snapshot,
  loading,
  runAction
}: {
  snapshot: DashboardSnapshot;
  loading: boolean;
  runAction: ActionRunner;
}) {
  const [vendorName, setVendorName] = useState("");
  const [productVendorId, setProductVendorId] = useState("");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [planProductId, setPlanProductId] = useState("");
  const [planName, setPlanName] = useState("");
  const [planType, setPlanType] = useState<"standard" | "enterprise">("standard");
  const [skuPlanId, setSkuPlanId] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [skuRegion, setSkuRegion] = useState<Sku["region"]>("US");
  const [skuBillingPeriod, setSkuBillingPeriod] = useState<Sku["billingPeriod"]>("monthly");

  useEffect(() => {
    setProductVendorId((current) => current || snapshot.vendors[0]?.id || "");
    setPlanProductId((current) => current || snapshot.products[0]?.id || "");
    setSkuPlanId((current) => current || snapshot.plans[0]?.id || "");
  }, [snapshot]);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ActionCard
        icon={Building2Icon}
        title="Create vendor"
        description="Add the software vendor before creating products underneath it."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void runAction(() => api.createVendor({ name: vendorName }), "Vendor created.").then((ok) => {
              if (ok) {
                setVendorName("");
              }
            });
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel>Vendor name</FieldLabel>
              <Input value={vendorName} onChange={(event) => setVendorName(event.target.value)} placeholder="Atlassian" />
              <FieldDescription>Use the public vendor name operators recognize immediately.</FieldDescription>
            </Field>
            <div className="flex justify-end">
              <Button disabled={!vendorName || loading}>
                <Building2Icon data-icon="inline-start" />
                Create vendor
              </Button>
            </div>
          </FieldGroup>
        </form>
      </ActionCard>

      <ActionCard
        icon={BoxesIcon}
        title="Create product"
        description="Link a product to an existing vendor so plans can be defined next."
      >
        {snapshot.vendors.length === 0 ? (
          <InlineEmpty text="Create a vendor first to unlock products." />
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runAction(
                () =>
                  api.createProduct({
                    vendorId: productVendorId,
                    name: productName,
                    description: productDescription
                  }),
                "Product created."
              ).then((ok) => {
                if (ok) {
                  setProductName("");
                  setProductDescription("");
                }
              });
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Vendor</FieldLabel>
                <Select value={productVendorId} onValueChange={setProductVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {snapshot.vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Product name</FieldLabel>
                <Input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Jira" />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Input
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  placeholder="Short operational description"
                />
              </Field>
              <div className="flex justify-end">
                <Button disabled={!productVendorId || !productName || loading}>
                  <BoxesIcon data-icon="inline-start" />
                  Create product
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </ActionCard>

      <ActionCard
        icon={Layers3Icon}
        title="Create plan"
        description="Define the commercial plan for a product."
      >
        {snapshot.products.length === 0 ? (
          <InlineEmpty text="Create a product first to unlock plans." />
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runAction(
                () => api.createPlan({ productId: planProductId, name: planName, planType }),
                "Plan created."
              ).then((ok) => {
                if (ok) {
                  setPlanName("");
                }
              });
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Product</FieldLabel>
                <Select value={planProductId} onValueChange={setPlanProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {snapshot.products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Plan name</FieldLabel>
                <Input value={planName} onChange={(event) => setPlanName(event.target.value)} placeholder="Standard" />
              </Field>
              <Field>
                <FieldLabel>Plan type</FieldLabel>
                <Select value={planType} onValueChange={(value) => setPlanType(value as typeof planType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="standard">standard</SelectItem>
                      <SelectItem value="enterprise">enterprise</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex justify-end">
                <Button disabled={!planProductId || !planName || loading}>
                  <Layers3Icon data-icon="inline-start" />
                  Create plan
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </ActionCard>

      <ActionCard
        icon={PackageIcon}
        title="Create sku"
        description="Create the sellable sku used by inventory pools and reservations."
      >
        {snapshot.plans.length === 0 ? (
          <InlineEmpty text="Create a plan first to unlock skus." />
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void runAction(
                () =>
                  api.createSku({
                    planId: skuPlanId,
                    code: skuCode,
                    billingPeriod: skuBillingPeriod,
                    region: skuRegion,
                    seatType: "seat"
                  }),
                "Sku created."
              ).then((ok) => {
                if (ok) {
                  setSkuCode("");
                }
              });
            }}
          >
            <FieldGroup>
              <Field>
                <FieldLabel>Plan</FieldLabel>
                <Select value={skuPlanId} onValueChange={setSkuPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {snapshot.plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Sku code</FieldLabel>
                <Input
                  value={skuCode}
                  onChange={(event) => setSkuCode(event.target.value)}
                  placeholder="jira-standard-monthly-us"
                />
              </Field>
              <Field>
                <FieldLabel>Region</FieldLabel>
                <Select value={skuRegion} onValueChange={(value) => setSkuRegion(value as Sku["region"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Billing period</FieldLabel>
                <Select
                  value={skuBillingPeriod}
                  onValueChange={(value) => setSkuBillingPeriod(value as Sku["billingPeriod"])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a billing period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="monthly">monthly</SelectItem>
                      <SelectItem value="yearly">yearly</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex justify-end">
                <Button disabled={!skuPlanId || !skuCode || loading}>
                  <PackageIcon data-icon="inline-start" />
                  Create sku
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </ActionCard>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: typeof Building2Icon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border bg-muted">
            <Icon />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageIcon />
        </EmptyMedia>
        <EmptyTitle>Action unavailable</EmptyTitle>
        <EmptyDescription>{text}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
