import { PackageIcon } from "lucide-react";

import type { ProductSearchResult } from "@/lib/api";
import { BillingDetailsFields } from "@/components/billing-details-fields";
import { FieldGroup } from "@/components/ui/field";
import type { BillingCycle, PricingDetails, Sku } from "@/types";

import { SetupStepCard } from "./setup-step-card";

export function BillingStep({
  selectedProduct,
  detailsReady,
  loadingPricing,
  existingSku,
  generatedSkuCode,
  skuRegion,
  onSkuRegionChange,
  billingCycles,
  onBillingCyclesChange,
  pricingDetails,
  onPricingDetailsChange,
  minimumUnits,
  onMinimumUnitsChange,
  maximumUnits,
  onMaximumUnitsChange,
  activationTimeline,
  onActivationTimelineChange,
}: {
  selectedProduct: ProductSearchResult | null;
  detailsReady: boolean;
  loadingPricing: boolean;
  existingSku?: Sku;
  generatedSkuCode: string;
  skuRegion: string;
  onSkuRegionChange: (value: string) => void;
  billingCycles: BillingCycle[];
  onBillingCyclesChange: (value: BillingCycle[]) => void;
  pricingDetails: PricingDetails;
  onPricingDetailsChange: (field: keyof PricingDetails, value: string) => void;
  minimumUnits: string;
  onMinimumUnitsChange: (value: string) => void;
  maximumUnits: string;
  onMaximumUnitsChange: (value: string) => void;
  activationTimeline: string;
  onActivationTimelineChange: (value: string) => void;
}) {
  return (
    <SetupStepCard
      step={2}
      icon={PackageIcon}
      title="Review offer details"
      description="We generate the regional offer code automatically so operators only need to confirm pricing and delivery details."
    >
      {selectedProduct ? (
        <FieldGroup>
          <BillingDetailsFields
            instanceKey={selectedProduct.id}
            region={skuRegion}
            onRegionChange={onSkuRegionChange}
            regionDescription="Each offer is regional. Choose either GCC or INDIA."
            catalogCode={generatedSkuCode}
            catalogCodeDescription={
              existingSku
                ? "This exact regional offer already exists, so the code is locked to the existing record."
                : generatedSkuCode
                  ? "Generated from the product, plan, and region."
                  : "Choose a plan in step 1 and a region here to generate the catalog code."
            }
            billingCycles={billingCycles}
            onBillingCyclesChange={onBillingCyclesChange}
            pricingDetails={pricingDetails}
            onPricingDetailsChange={onPricingDetailsChange}
            minimumUnits={minimumUnits}
            onMinimumUnitsChange={onMinimumUnitsChange}
            maximumUnits={maximumUnits}
            onMaximumUnitsChange={onMaximumUnitsChange}
            activationTimeline={activationTimeline}
            onActivationTimelineChange={onActivationTimelineChange}
            disabled={!detailsReady || loadingPricing}
            amountDescription="Required for every billing cycle you keep on the offer."
          />
        </FieldGroup>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Choose a product and plan in step 1 to fill in the regional offer
          details here.
        </p>
      )}
    </SetupStepCard>
  );
}
