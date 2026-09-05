import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

describe("ConfirmModal", () => {
  it("shows message", () => {
    render(
      <ConfirmModal
        isOpen={true}
        onCancel={() => {}}
        onConfirm={() => {}}
        title="Delete"
        message="Are you sure?"
      />,
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onCancel={() => {}}
        onConfirm={onConfirm}
        title="Delete"
        message="Are you sure?"
        confirmLabel="Yes, Delete"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button clicked", async () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onCancel={onCancel}
        onConfirm={() => {}}
        title="Delete"
        message="Are you sure?"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
