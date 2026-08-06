import { afterEach, describe, expect, it, vi } from "vitest";

const contentApi = vi.hoisted(() => ({
  getFeaturedTestimonials: vi.fn(),
  getTestimonial: vi.fn(),
  testimonialsPage: vi.fn(),
}));

vi.mock("@/lib/content-api", () => contentApi);

import { GET as getDetail } from "@/app/api/testimonials/[uuid]/route";
import { GET as getFeatured } from "@/app/api/testimonials/featured/route";
import { GET as getList } from "@/app/api/testimonials/route";

const uuid = "11111111-1111-4111-8111-111111111111";

afterEach(() => vi.clearAllMocks());

describe("Testimonials public proxy", () => {
  it.each([
    "locale=fr",
    "type=staff",
    "page=0",
    "page=-1",
    "page=1.5",
    "page=10001",
    "page_size=0",
    "page_size=51",
  ])("rejects invalid list input: %s", async (query) => {
    const response = await getList(
      new Request(`http://localhost/api/testimonials?${query}`),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid_request",
    });
    expect(contentApi.testimonialsPage).not.toHaveBeenCalled();
  });

  it("passes validated list parameters to the backend client", async () => {
    contentApi.testimonialsPage.mockResolvedValue({
      data: [],
      meta: { page: 2, page_size: 12, total: 13 },
    });

    const response = await getList(
      new Request(
        "http://localhost/api/testimonials?locale=en&type=farmer&page=2&page_size=12",
      ),
    );

    expect(response.status).toBe(200);
    expect(contentApi.testimonialsPage).toHaveBeenCalledWith(
      "en",
      "farmer",
      2,
      12,
    );
  });

  it("does not turn a featured upstream failure into an empty success", async () => {
    contentApi.getFeaturedTestimonials.mockRejectedValue(new Error("secret"));

    const response = await getFeatured(
      new Request("http://localhost/api/testimonials/featured?locale=vi"),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: "upstream_unavailable",
    });
  });

  it("returns a safe 502 for list and detail upstream failures", async () => {
    contentApi.testimonialsPage.mockRejectedValue(new Error("database secret"));
    contentApi.getTestimonial.mockRejectedValue(new Error("database secret"));

    const list = await getList(
      new Request("http://localhost/api/testimonials?locale=vi"),
    );
    const detail = await getDetail(
      new Request(`http://localhost/api/testimonials/${uuid}?locale=vi`),
      { params: Promise.resolve({ uuid }) },
    );

    expect(list.status).toBe(502);
    expect(detail.status).toBe(502);
    expect(JSON.stringify(await detail.json())).not.toContain(
      "database secret",
    );
  });

  it("keeps a true missing detail distinct from an upstream failure", async () => {
    contentApi.getTestimonial.mockResolvedValue(null);

    const response = await getDetail(
      new Request(`http://localhost/api/testimonials/${uuid}?locale=en`),
      { params: Promise.resolve({ uuid }) },
    );

    expect(response.status).toBe(404);
    expect(contentApi.getTestimonial).toHaveBeenCalledWith(uuid, "en");
  });

  it("rejects invalid locale on featured and detail", async () => {
    const featured = await getFeatured(
      new Request("http://localhost/api/testimonials/featured?locale=x"),
    );
    const detail = await getDetail(
      new Request(`http://localhost/api/testimonials/${uuid}?locale=x`),
      { params: Promise.resolve({ uuid }) },
    );

    expect(featured.status).toBe(400);
    expect(detail.status).toBe(400);
    expect(contentApi.getFeaturedTestimonials).not.toHaveBeenCalled();
    expect(contentApi.getTestimonial).not.toHaveBeenCalled();
  });
});
