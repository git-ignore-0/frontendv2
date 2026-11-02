import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupportedShippingAreas } from "./shipping-areas";
import { AccountApiError } from "./api";

afterEach(() => vi.unstubAllGlobals());
describe("supported shipping areas", () => {
  it("decodes only the supported province/ward contract and passes locale and cancellation", async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async () =>
      Response.json({
        data: [
          {
            province_code: "66",
            province_name: "Đồng Tháp",
            wards: [
              {
                ward_code: "22015",
                ward_name: "Phường Mỹ Ngãi",
                shipping_fee_vnd: "30000",
              },
            ],
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await getSupportedShippingAreas("vi", controller.signal)).toEqual([
      {
        code: "66",
        name: "Đồng Tháp",
        wards: [
          { code: "22015", name: "Phường Mỹ Ngãi", shippingFeeVnd: "30000" },
        ],
      },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/shipping-areas?locale=vi",
      expect.objectContaining({ signal: controller.signal }),
    );
  });
  it.each([
    null,
    {},
    [
      {
        province_code: "66",
        province_name: "Name",
        wards: [{ ward_code: "1", ward_name: "Ward", shipping_fee_vnd: null }],
      },
    ],
  ])("rejects malformed data", async (data) => {
    vi.stubGlobal("fetch", async () => Response.json({ data }));
    await expect(getSupportedShippingAreas("en")).rejects.toBeInstanceOf(
      AccountApiError,
    );
  });
  it("accepts an empty supported-area list", async () => {
    vi.stubGlobal("fetch", async () => Response.json({ data: [] }));
    expect(await getSupportedShippingAreas("en")).toEqual([]);
  });
});
