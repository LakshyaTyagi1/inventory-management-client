import { PencilRulerIcon } from "lucide-react";

import { BillingDetailsFields } from "@/components/billing-details-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PricePerUnit } from "@/types";

import type { ViewSetupEntry } from "./types";

export function EditBillingDialog({
  entry,
  open,
  onOpenChange,
  region,
  onRegionChange,
  generatedCode,
  pricingOptions,
  onPricingOptionChange,
  onAddPricingOption,
  onRemovePricingOption,
  purchaseConstraints,
  onPurchaseConstraintsChange,
  activationTimeline,
  onActivationTimelineChange,
  canSave,
  loading,
  onSave,
}: {
  entry: ViewSetupEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  region: string;
  onRegionChange: (value: string) => void;
  generatedCode: string;
  pricingOptions: PricePerUnit[];
  onPricingOptionChange: (
    index: number,
    field: keyof PricePerUnit,
    value: string,
  ) => void;
  onAddPricingOption: () => void;
  onRemovePricingOption: (index: number) => void;
  purchaseConstraints: string;
  onPurchaseConstraintsChange: (value: string) => void;
  activationTimeline: string;
  onActivationTimelineChange: (value: string) => void;
  canSave: boolean;
  loading: boolean;
  onSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {entry && (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit billing</DialogTitle>
            <DialogDescription>
              Update the billing option for {entry.product.name} ·{" "}
              {entry.plan.name} using the same fields operators see in the
              create flow.
            </DialogDescription>
          </DialogHeader>

          <BillingDetailsFields
            instanceKey={entry.sku._id}
            region={region}
            onRegionChange={onRegionChange}
            regionDescription={
              entry.hasLockedRegion
                ? "Region is locked after stock exists for this offer."
                : "Each offer is regional. Choose GCC or INDIA."
            }
            regionDisabled={entry.hasLockedRegion}
            catalogCode={generatedCode}
            catalogCodeDescription="The code updates automatically from the product, plan, and region."
            pricingOptions={pricingOptions}
            onPricingOptionChange={onPricingOptionChange}
            onAddPricingOption={onAddPricingOption}
            onRemovePricingOption={onRemovePricingOption}
            purchaseConstraints={purchaseConstraints}
            onPurchaseConstraintsChange={onPurchaseConstraintsChange}
            activationTimeline={activationTimeline}
            onActivationTimelineChange={onActivationTimelineChange}
            disabled={loading}
            amountDescription="Keep each billing cycle aligned with the operator-facing MSRP."
            ratePeriodDescription="Only fill this in when the commercial quote uses a different cadence label."
          />

          <DialogFooter showCloseButton>
            <Button disabled={!canSave || loading} onClick={onSave}>
              <PencilRulerIcon data-icon="inline-start" />
              Save billing
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}
