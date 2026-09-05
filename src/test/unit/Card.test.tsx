import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader } from "../../components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText("Card Content")).toBeInTheDocument();
  });

  it("applies interactive class when interactive prop is true", () => {
    render(<Card interactive>Interactive Card</Card>);
    const card = screen.getByText("Interactive Card").closest("div");
    expect(card?.className).toContain("cursor-pointer");
  });

  it("removes padding when noPadding is true", () => {
    render(<Card noPadding>No Padding Card</Card>);
    const card = screen.getByText("No Padding Card").closest("div");
    expect(card?.className).not.toContain("p-4");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header Content</CardHeader>);
    expect(screen.getByText("Header Content")).toBeInTheDocument();
  });
});
