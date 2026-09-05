import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginModal } from "../../features/auth/components/LoginModal";

describe("LoginModal", () => {
  it("shows email and password fields", () => {
    render(
      <LoginModal isOpen={true} onClose={() => {}} onLogin={async () => {}} />,
    );
    expect(screen.getByPlaceholderText("you@company.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });

  it("calls onLogin with credentials when submitted", async () => {
    const onLogin = vi.fn();
    render(<LoginModal isOpen={true} onClose={() => {}} onLogin={onLogin} />);

    await userEvent.type(
      screen.getByPlaceholderText("you@company.com"),
      "test@example.com",
    );
    await userEvent.type(
      screen.getByPlaceholderText("••••••••"),
      "password123",
    );
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(onLogin).toHaveBeenCalledWith("test@example.com", "password123");
  });
});
