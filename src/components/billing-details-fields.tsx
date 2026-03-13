import { PlusIcon, Trash2Icon } from "lucide-react";

import type { PricePerUnit } from "@/types";
import { commonRegionOptions, billingCycleOptions } from "@/lib/billing-option";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SelectOrInput } from "@/components/ui/select-or-input";

export function BillingDetailsFields({
  instanceKey,
  region,
  onRegionChange,
  regionDescription,
  regionDisabled,
  catalogCode,
  catalogCodeDescription,
  pricingOptions,
  onPricingOptionChange,
  onAddPricingOption,
  onRemovePricingOption,
  purchaseConstraints,
  onPurchaseConstraintsChange,
  activationTimeline,
  onActivationTimelineChange,
  disabled,
  amountDescription,
  ratePeriodDescription,
}: {
  instanceKey: string;
  region: string;
  onRegionChange: (value: string) => void;
  regionDescription: string;
  regionDisabled?: boolean;
  catalogCode: string;
  catalogCodeDescription: string;
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
  disabled?: boolean;
  amountDescription: string;
  ratePeriodDescription: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel>Region</FieldLabel>
        <SelectOrInput
          key={`${instanceKey}-region`}
          options={commonRegionOptions}
          value={region}
          onChange={onRegionChange}
          placeholder="Select a region"
          inputPlaceholder="GCC or INDIA"
          disabled={disabled || regionDisabled}
        />
        <FieldDescription>{regionDescription}</FieldDescription>
      </Field>

      <Field className="sm:col-span-2">
        <FieldLabel>Catalog code</FieldLabel>
        <Input
          value={catalogCode}
          placeholder="Generated automatically"
          readOnly
        />
        <FieldDescription>{catalogCodeDescription}</FieldDescription>
      </Field>

      <div className="sm:col-span-2 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <FieldLabel>Pricing options</FieldLabel>
            <FieldDescription>
              Add each billing cycle this regional offer supports.
            </FieldDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddPricingOption}
            disabled={
              disabled || pricingOptions.length >= billingCycleOptions.length
            }
          >
            <PlusIcon data-icon="inline-start" />
            Add cycle
          </Button>
        </div>

        {pricingOptions.map((pricePerUnit, index) => (
          <div
            key={`${instanceKey}-pricing-option-${index}`}
            className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Pricing option {index + 1}</p>
              {pricingOptions.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemovePricingOption(index)}
                  disabled={disabled}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Remove
                </Button>
              ) : null}
            </div>

            <Field>
              <FieldLabel>Billing cycle</FieldLabel>
              <SelectOrInput
                key={`${instanceKey}-billing-cycle-${index}`}
                options={billingCycleOptions}
                value={pricePerUnit.billingCycle}
                onChange={(value) =>
                  onPricingOptionChange(index, "billingCycle", value)
                }
                placeholder="Select a billing cycle"
                inputPlaceholder="e.g. quarterly"
                disabled={disabled}
              />
            </Field>

            <Field>
              <FieldLabel>Price amount</FieldLabel>
              <Input
                value={pricePerUnit.amount}
                onChange={(event) =>
                  onPricingOptionChange(index, "amount", event.target.value)
                }
                placeholder="e.g. 12"
                inputMode="decimal"
                disabled={disabled}
              />
              <FieldDescription>{amountDescription}</FieldDescription>
            </Field>

            <Field>
              <FieldLabel>Currency</FieldLabel>
              <Input
                value={pricePerUnit.currency ?? ""}
                onChange={(event) =>
                  onPricingOptionChange(index, "currency", event.target.value)
                }
                placeholder="USD"
                disabled={disabled}
              />
            </Field>

            <Field>
              <FieldLabel>Charged per</FieldLabel>
              <Input
                value={pricePerUnit.entity ?? ""}
                onChange={(event) =>
                  onPricingOptionChange(index, "entity", event.target.value)
                }
                placeholder="e.g. user"
                disabled={disabled}
              />
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel>Rate period</FieldLabel>
              <Input
                value={pricePerUnit.ratePeriod ?? ""}
                onChange={(event) =>
                  onPricingOptionChange(index, "ratePeriod", event.target.value)
                }
                placeholder="e.g. month"
                disabled={disabled}
              />
              <FieldDescription>{ratePeriodDescription}</FieldDescription>
            </Field>
          </div>
        ))}
      </div>

      <Field>
        <FieldLabel>Minimum / maximum</FieldLabel>
        <Input
          value={purchaseConstraints}
          onChange={(event) => onPurchaseConstraintsChange(event.target.value)}
          placeholder="e.g. 3 / then bundles of 5"
          disabled={disabled}
        />
        <FieldDescription>
          Keep the source rule as written. We will parse min/max or bundle steps
          when possible.
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>Activation timeline</FieldLabel>
        <Input
          value={activationTimeline}
          onChange={(event) => onActivationTimelineChange(event.target.value)}
          placeholder="e.g. 7 Working Days"
          disabled={disabled}
        />
        <FieldDescription>
          Capture the operator-facing SLA or provisioning expectation for this
          region.
        </FieldDescription>
      </Field>
    </div>
  );
}
