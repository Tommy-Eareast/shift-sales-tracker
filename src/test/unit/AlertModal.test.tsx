import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AlertModal } from "../../components/ui/AlertModal";

describe("AlertModal", () => {
  it("shows title and message", () => {
    render(
      <AlertModal
        isOpen={true}
        title="Error"
        message="Something went wrong"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("calls onClose when OK clicked", async () => {
    const onClose = vi.fn();
    render(
      <AlertModal
        isOpen={true}
        title="Error"
        message="Oops"
        onClose={onClose}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
