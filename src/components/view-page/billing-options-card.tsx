import { Link } from "react-router-dom";
import { PackagePlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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

import { BillingOptionTile } from "./billing-option-tile";
import type { ViewSetupEntry } from "./types";

export function BillingOptionsCard({
  entries,
  description,
  viewAllHref,
  onEditBilling,
  onEditInventory,
}: {
  entries: ViewSetupEntry[];
  description: string;
  viewAllHref?: string;
  onEditBilling: (skuId: string) => void;
  onEditInventory: (input: { skuId: string; poolId?: string }) => void;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Billing options</CardTitle>
        <CardDescription>{description}</CardDescription>
        {viewAllHref ? (
          <CardAction>
            <Button asChild variant="outline" size="sm">
              <Link to={viewAllHref}>View all</Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackagePlusIcon />
              </EmptyMedia>
              <EmptyTitle>No matching billing options</EmptyTitle>
              <EmptyDescription>
                Adjust the search or create a new setup from the create page.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => (
              <BillingOptionTile
                key={entry.sku._id}
                entry={entry}
                onEditBilling={onEditBilling}
                onEditInventory={onEditInventory}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
