import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TechCarousel } from "./TechCarousel";

const chapter = {
  title: "Tools I ship with",
  pauseLabel: "Pause logo carousel",
  playLabel: "Play logo carousel",
  items: [
    { id: "react", name: "React", path: "M0 0h24v24H0z" },
    { id: "python", name: "Python", path: "M0 0h24v24H0z" },
  ],
};

function mockMedia({ reduced = false, desktop = false } = {}) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query) => ({
      matches: query.includes("reduced-motion") ? reduced : desktop,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("TechCarousel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exposes each tech once to assistive tech despite the looped copy", () => {
    mockMedia();
    render(<TechCarousel chapter={chapter} active />);

    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.getAllByText("React")).toHaveLength(2);
    expect(screen.getByRole("list")).toHaveTextContent("ReactPython");
  });

  it("toggles between pause and play", () => {
    mockMedia({ desktop: true });
    render(<TechCarousel chapter={chapter} active />);

    fireEvent.click(
      screen.getByRole("button", { name: "Pause logo carousel" }),
    );
    expect(
      screen.getByRole("button", { name: "Play logo carousel" }),
    ).toBeInTheDocument();
  });

  it("renders one static list with no pause control under reduced motion", () => {
    mockMedia({ reduced: true });
    render(<TechCarousel chapter={chapter} active />);

    expect(screen.getAllByText("React")).toHaveLength(1);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
