import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TestimonialImage } from "@/components/testimonials/testimonial-presentation";
import { getSiteContent } from "@/content/site-content";
import { testimonialFixture } from "@/test/testimonial-fixture";

afterEach(cleanup);

const imageAlt = getSiteContent("en").testimonials.imageAlt.replace(
  "{name}",
  "Nguyen An",
);

describe("testimonial media presentation", () => {
  it("renders a backend media URL and responsive variants, never the image object", () => {
    render(
      <TestimonialImage
        alt={imageAlt}
        sizes="100vw"
        story={testimonialFixture()}
      />,
    );

    const image = screen.getByRole("img", { name: imageAlt });
    expect(image).toHaveAttribute(
      "src",
      "https://media.example.com/an-480.jpg",
    );
    expect(image).toHaveAttribute(
      "srcset",
      "https://media.example.com/an-480.jpg 480w",
    );
    expect(image.outerHTML).not.toContain("[object Object]");
  });

  it("uses the semantic fallback when the testimonial has no image", () => {
    const { container } = render(
      <TestimonialImage
        alt={imageAlt}
        sizes="100vw"
        story={testimonialFixture({ image: null })}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      container.querySelector(".testimonials-image-fallback"),
    ).toBeInTheDocument();
  });
});
