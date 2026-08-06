import { UserIcon } from "@/components/icons";
import { testimonialImageSources } from "@/features/testimonials/testimonial-media";
import type { PublicTestimonial } from "@/lib/content-api";

export function TestimonialTag({
  customerLabel,
  farmerLabel,
  type,
}: {
  customerLabel: string;
  farmerLabel: string;
  type: PublicTestimonial["type"];
}) {
  return (
    <span className={`testimonials-tag is-${type}`}>
      {type === "farmer" ? farmerLabel : customerLabel}
    </span>
  );
}

export function TestimonialImage({
  alt,
  className,
  sizes,
  story,
}: {
  alt: string;
  className?: string;
  sizes: string;
  story: PublicTestimonial;
}) {
  if (!story.image) {
    return (
      <span
        aria-hidden="true"
        className={`testimonials-image-fallback ${className ?? ""}`}
      >
        <UserIcon />
      </span>
    );
  }
  const sources = testimonialImageSources(story.image);
  return (
    // Backend media hosts are deployment-configured and cannot be enumerated safely in next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={className}
      height={story.image.height}
      loading="lazy"
      sizes={sizes}
      src={sources.src}
      srcSet={sources.srcSet}
      width={story.image.width}
    />
  );
}
