import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "@/components/site-header";
import { getSiteContent } from "@/content/site-content";

vi.mock("next/navigation", () => ({ usePathname: () => "/en" }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("site header session projection", () => {
  it("clears an initial user when the session endpoint fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ error: "upstream_unavailable" }, { status: 502 }),
        ),
    );

    render(
      <SiteHeader
        dictionary={getSiteContent("en").common}
        externalLinks={{}}
        initialUser={{
          sub: "11111111-1111-4111-8111-111111111111",
          name: "Stale Member",
          email: "member@example.com",
          email_verified: true,
          locale: "en",
          status: "active",
          roles: [],
        }}
        locale="en"
      />,
    );

    expect(screen.getByRole("link", { name: "Account" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Stale Member")).not.toBeInTheDocument(),
    );
    expect(
      screen.getAllByRole("link", { name: "Sign in" }).length,
    ).toBeGreaterThan(0);
  });
});
