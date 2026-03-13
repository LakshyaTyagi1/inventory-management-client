import { act, useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { BillingCycle } from "@/types";

import { BillingCycleMultiSelect } from "../billing-cycle-multi-select";

function ControlledBillingCycleMultiSelect({
  initialValue,
  onChange,
}: {
  initialValue: BillingCycle[];
  onChange?: (value: BillingCycle[]) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <BillingCycleMultiSelect
      value={value}
      onChange={(nextValue) => {
        onChange?.(nextValue);
        setValue(nextValue);
      }}
    />
  );
}

describe("BillingCycleMultiSelect", () => {
  it("lets monthly and yearly be selected together", async () => {
    const onChange = vi.fn();

    render(
      <ControlledBillingCycleMultiSelect
        initialValue={["monthly"]}
        onChange={onChange}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /billing cycles/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: /^yearly$/i }));
    });

    expect(onChange).toHaveBeenLastCalledWith(["monthly", "yearly"]);

    const trigger = screen.getByRole("button", { name: /billing cycles/i });
    expect(within(trigger).getByText(/^monthly$/i)).toBeInTheDocument();
    expect(within(trigger).getByText(/^yearly$/i)).toBeInTheDocument();
  });

  it("keeps one time exclusive and allows switching back", async () => {
    render(
      <ControlledBillingCycleMultiSelect initialValue={["monthly", "yearly"]} />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /billing cycles/i }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: /^one time$/i }));
    });

    const trigger = screen.getByRole("button", { name: /billing cycles/i });
    expect(within(trigger).getByText(/^one time$/i)).toBeInTheDocument();
    expect(within(trigger).queryByText(/^monthly$/i)).not.toBeInTheDocument();
    expect(within(trigger).queryByText(/^yearly$/i)).not.toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole("option", { name: /^monthly$/i }));
    });

    expect(within(trigger).getByText(/^monthly$/i)).toBeInTheDocument();
    expect(within(trigger).queryByText(/^one time$/i)).not.toBeInTheDocument();
    expect(within(trigger).queryByText(/^yearly$/i)).not.toBeInTheDocument();
  });
});