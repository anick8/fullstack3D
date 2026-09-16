import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactBar } from "./ContactBar";

const contact = {
  email: "me@example.com",
  links: [
    {
      label: "LinkedIn",
      ariaLabel: "LinkedIn profile and resume",
      href: "https://linkedin.example/me",
    },
    {
      label: "GitHub",
      ariaLabel: "GitHub profile",
      href: "https://github.example/me",
    },
  ],
};

function mockClipboard(writeText) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
}

describe("ContactBar", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copies the email address and confirms", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<ContactBar contact={contact} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy email address/i }),
      );
    });

    expect(writeText).toHaveBeenCalledWith("me@example.com");
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
    expect(screen.getByText("Email address copied")).toBeInTheDocument();
  });

  it("falls back to mailto when the clipboard rejects", async () => {
    mockClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    const original = window.location;
    Object.defineProperty(window, "location", {
      value: { href: "" },
      configurable: true,
    });
    render(<ContactBar contact={contact} />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy email address/i }),
      );
    });

    expect(window.location.href).toBe("mailto:me@example.com");
    Object.defineProperty(window, "location", {
      value: original,
      configurable: true,
    });
  });

  it("links to LinkedIn and GitHub in a new tab", () => {
    render(<ContactBar contact={contact} />);
    const linkedin = screen.getByRole("link", {
      name: "LinkedIn profile and resume",
    });
    const github = screen.getByRole("link", { name: "GitHub profile" });
    expect(linkedin).toHaveAttribute("href", "https://linkedin.example/me");
    expect(github).toHaveAttribute("href", "https://github.example/me");
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
  });
});
