import { act, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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
      fireEvent.click(screen.getByRole("button", { name: /^yearly$/i }));
    });

    expect(onChange).toHaveBeenLastCalledWith(["monthly", "yearly"]);

    expect(screen.getByRole("button", { name: /^monthly$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^yearly$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps one time exclusive and allows switching back", async () => {
    render(
      <ControlledBillingCycleMultiSelect
        initialValue={["monthly", "yearly"]}
      />,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^one time$/i }));
    });

    expect(screen.getByRole("button", { name: /^one time$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^monthly$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /^yearly$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^monthly$/i }));
    });

    expect(screen.getByRole("button", { name: /^monthly$/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^one time$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /^yearly$/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
