import { describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ redirect }));

import CSAContractVerificationEntry from "@/app/csa/verify/page";

describe("CSA contract verification entry route", () => {
  it("preserves the QR reference while redirecting to the default locale", async () => {
    await CSAContractVerificationEntry({
      searchParams: Promise.resolve({ reference: "CSA-202609-8F3K2M" }),
    });

    expect(redirect).toHaveBeenCalledWith(
      "/csa/verify/en?reference=CSA-202609-8F3K2M",
    );
  });

  it("does not forward unrelated query parameters", async () => {
    await CSAContractVerificationEntry({
      searchParams: Promise.resolve({}),
    });

    expect(redirect).toHaveBeenCalledWith("/csa/verify/en");
  });
});
