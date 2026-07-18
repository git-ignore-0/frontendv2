import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RichText } from "@/features/workshops/rich-text";

describe("workshop rich text", () => {
  it("renders every image in the position where it was inserted", () => {
    const { container } = render(
      <RichText
        document={{
          type: "doc",
          content: [
            {
              type: "image",
              attrs: { src: "https://example.com/cover.webp", alt: "Cover" },
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "Workshop content" }],
            },
            {
              type: "image",
              attrs: { src: "https://example.com/detail.webp", alt: "Detail" },
            },
          ],
        }}
      />,
    );

    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAccessibleName("Cover");
    expect(images[1]).toHaveAccessibleName("Detail");
    expect(
      Array.from(
        container.querySelector(".workshop-prose")?.children || [],
      ).map((element) => element.tagName),
    ).toEqual(["IMG", "P", "IMG"]);
  });

  it("renders an applied URL as a working external link", () => {
    render(
      <RichText
        document={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Read more",
                  marks: [
                    {
                      type: "link",
                      attrs: { href: "https://example.com/workshop" },
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "Read more" })).toHaveAttribute(
      "href",
      "https://example.com/workshop",
    );
  });
});
