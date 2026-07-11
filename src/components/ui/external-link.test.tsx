import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLink } from "./external-link";

describe("ExternalLink", () => {
  it("announces and safely opens an external destination", () => {
    render(<ExternalLink href="https://example.com">Cửa hàng</ExternalLink>);
    const link = screen.getByRole("link", {
      name: /Cửa hàng.*mở trong tab mới/i,
    });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
  });
});
