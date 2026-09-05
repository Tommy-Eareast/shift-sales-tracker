import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AutocompleteInput from "../../components/AutocompleteInput";

function TestWrapper({ suggestions }: { suggestions: string[] }) {
  const [value, setValue] = useState("");
  return (
    <AutocompleteInput
      label="Brand"
      value={value}
      onChange={setValue}
      suggestions={suggestions}
      placeholder="Type brand..."
    />
  );
}

describe("AutocompleteInput", () => {
  const suggestions = ["Montblanc", "Coach", "Lacoste"];

  it("filters suggestions as user types", async () => {
    render(<TestWrapper suggestions={suggestions} />);

    const input = screen.getByPlaceholderText("Type brand...");
    await userEvent.type(input, "Mo");

    expect(await screen.findByText("Montblanc")).toBeInTheDocument();
    expect(screen.queryByText("Coach")).not.toBeInTheDocument();
    expect(screen.queryByText("Lacoste")).not.toBeInTheDocument();
  });

  it("calls onChange when suggestion is clicked", async () => {
    render(<TestWrapper suggestions={suggestions} />);

    const input = screen.getByPlaceholderText("Type brand...");
    await userEvent.type(input, "Mo");

    const suggestion = await screen.findByText("Montblanc");
    await userEvent.click(suggestion);

    expect(input).toHaveValue("Montblanc");
  });
});
