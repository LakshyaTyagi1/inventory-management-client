import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/lib/api";
import type { SaleListEntry } from "@/types";

vi.mock("@/lib/api", () => ({
  api: {
    getSku: vi.fn(),
  },
}));

import { SalesPage } from "../sales-page";

const sales: SaleListEntry[] = [
  {
    sale: {
      _id: "sale-1",
      skuId: "sku-1",
      skuCode: "pipedrive-starter-pack-india",
      quantity: 2,
      partner: {
        name: "Zoftware Reseller",
        saleReference: "sale-1001",
      },
      customer: {
        name: "Ayesha Khan",
        email: "ayesha@example.com",
        phone: "+971500000000",
        additionalInfo: {
          company: "Example Trading LLC",
          country: "UAE",
        },
      },
      payment: {
        provider: "stripe",
        transactionId: "txn-1001",
        amount: "59.00",
        currency: "USD",
        status: "captured",
        metadata: {
          gatewayOrderId: "gw-1001",
        },
      },
      createdAt: "2026-03-16T08:00:00.000Z",
    },
    sku: {
      _id: "sku-1",
      planId: "plan-1",
      code: "pipedrive-starter-pack-india",
      region: "INDIA",
      seatType: "seat",
      pricingOptions: [
        {
          billingCycle: "monthly",
          amount: "3060",
          currency: "INR",
          entity: "user",
          ratePeriod: "month",
        },
      ],
      purchaseConstraints: {
        minUnits: 1,
        maxUnits: 25,
      },
      createdAt: "2026-03-16T00:00:00.000Z",
    },
    plan: {
      _id: "plan-1",
      productId: "product-1",
      name: "Starter Pack",
      planType: "standard",
      createdAt: "2026-03-16T00:00:00.000Z",
    },
    product: {
      _id: "product-1",
      externalId: "pipedrive",
      name: "Pipedrive",
      vendor: "Pipedrive",
      description: "CRM",
      logoUrl: "",
      createdAt: "2026-03-16T00:00:00.000Z",
    },
  },
  {
    sale: {
      _id: "sale-2",
      skuId: "sku-2",
      skuCode: "slack-business-gcc",
      quantity: 3,
      partner: {
        name: "Channel Partner One",
        saleReference: "sale-2001",
      },
      customer: {
        name: "Fatima Noor",
        email: "fatima@example.ae",
        phone: "+971500000111",
      },
      payment: {
        provider: "checkout",
        transactionId: "txn-2001",
        amount: "36.126",
        currency: "USD",
        status: "captured",
      },
      createdAt: "2026-03-15T08:00:00.000Z",
    },
    sku: {
      _id: "sku-2",
      planId: "plan-2",
      code: "slack-business-gcc",
      region: "GCC",
      seatType: "seat",
      pricingOptions: [
        {
          billingCycle: "monthly",
          amount: "12",
          currency: "USD",
          entity: "user",
          ratePeriod: "month",
        },
      ],
      purchaseConstraints: {
        minUnits: 1,
        maxUnits: 20,
      },
      createdAt: "2026-03-16T00:00:00.000Z",
    },
    plan: {
      _id: "plan-2",
      productId: "product-2",
      name: "Business",
      planType: "standard",
      createdAt: "2026-03-16T00:00:00.000Z",
    },
    product: {
      _id: "product-2",
      externalId: "slack",
      name: "Slack",
      vendor: "Salesforce",
      description: "Chat",
      logoUrl: "",
      createdAt: "2026-03-16T00:00:00.000Z",
    },
  },
];

describe("sales page", () => {
  beforeEach(() => {
    vi.mocked(api.getSku).mockReset();
  });

  it("renders recorded sales and filters by search query", async () => {
    render(<SalesPage sales={sales} loading={false} />);

    expect(screen.getByText("Pipedrive")).toBeInTheDocument();
    expect(screen.getByText("Slack")).toBeInTheDocument();
    expect(screen.getByText(/ayesha@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/gatewayOrderId: gw-1001/i)).toBeInTheDocument();
    expect(screen.getByText(/36\.13 usd/i)).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(
        screen.getByPlaceholderText(
          /search by product, sku code, partner, customer, or transaction/i,
        ),
        {
          target: { value: "channel partner one" },
        },
      );
    });

    expect(screen.queryByText("Pipedrive")).not.toBeInTheDocument();
    expect(screen.getByText("Slack")).toBeInTheDocument();
  });

  it("loads and caches sku details when a row is expanded", async () => {
    vi.mocked(api.getSku).mockResolvedValue({
      _id: "sku-1",
      planId: "plan-1",
      code: "pipedrive-starter-pack-india",
      region: "INDIA",
      seatType: "seat",
      pricingOptions: [
        {
          billingCycle: "monthly",
          amount: "3060",
          currency: "INR",
          entity: "user",
          ratePeriod: "month",
        },
        {
          billingCycle: "yearly",
          amount: "36000",
          currency: "INR",
          entity: "user",
          ratePeriod: "year",
        },
      ],
      purchaseConstraints: {
        minUnits: 1,
        maxUnits: 25,
      },
      activationTimeline: "7 working days",
      isBillingDisabled: false,
      createdAt: "2026-03-16T00:00:00.000Z",
    });

    render(<SalesPage sales={sales} loading={false} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /show sku details for pipedrive/i,
      }),
    );

    expect(api.getSku).toHaveBeenCalledWith("sku-1");

    expect(await screen.findByText(/pricing options/i)).toBeInTheDocument();
    expect(screen.getByText(/7 working days/i)).toBeInTheDocument();
    expect(screen.getByText(/36000/i)).toBeInTheDocument();
    expect(screen.getByText(/^subscription$/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: /hide sku details for pipedrive/i,
      }),
    );

    await waitFor(() => {
      expect(screen.queryByText(/7 working days/i)).not.toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: /show sku details for pipedrive/i,
      }),
    );

    await screen.findByText(/7 working days/i);
    expect(api.getSku).toHaveBeenCalledTimes(1);
  });

  it("shows a one-time tag when the loaded sku only has one_time pricing", async () => {
    vi.mocked(api.getSku).mockResolvedValue({
      _id: "sku-2",
      planId: "plan-2",
      code: "slack-business-gcc",
      region: "GCC",
      seatType: "seat",
      pricingOptions: [
        {
          billingCycle: "one_time",
          amount: "299",
          currency: "USD",
          entity: "license",
          ratePeriod: "one time",
        },
      ],
      purchaseConstraints: {
        minUnits: 1,
        maxUnits: 20,
      },
      activationTimeline: "Instant",
      isBillingDisabled: false,
      createdAt: "2026-03-16T00:00:00.000Z",
    });

    render(<SalesPage sales={sales} loading={false} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /show sku details for slack/i,
      }),
    );

    expect(await screen.findByText(/^one-time$/i)).toBeInTheDocument();
  });

  it("shows an empty state when no sales exist", () => {
    render(<SalesPage sales={[]} loading={false} />);

    expect(screen.getByText(/no sales recorded/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /seed or record a partner sale and it will appear here/i,
      ),
    ).toBeInTheDocument();
  });
});
