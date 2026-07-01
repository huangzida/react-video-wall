import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Counter } from "./Counter";

describe("Counter", () => {
  it("renders the initial count", () => {
    render(<Counter initial={7} />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("increments by step on click", async () => {
    const user = userEvent.setup();
    render(<Counter initial={0} step={2} />);

    await user.click(screen.getByRole("button", { name: "increment" }));
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("decrements by step on click", async () => {
    const user = userEvent.setup();
    render(<Counter initial={5} step={2} />);

    await user.click(screen.getByRole("button", { name: "decrement" }));
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("resets to the initial value", async () => {
    const user = userEvent.setup();
    render(<Counter initial={4} />);

    await user.click(screen.getByRole("button", { name: "increment" }));
    await user.click(screen.getByText("reset"));
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
