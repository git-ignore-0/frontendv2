import type { PublicTestimonial } from "@/lib/content-api";

export function testimonialFixture(
  overrides: Partial<PublicTestimonial> = {},
): PublicTestimonial {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    type: "customer",
    display_name: "Nguyen An",
    image: {
      id: "22222222-2222-4222-8222-222222222222",
      url: "https://media.example.com/an.jpg",
      width: 1200,
      height: 800,
      variants: [
        {
          width: 480,
          height: 320,
          file: "an-480.jpg",
          url: "https://media.example.com/an-480.jpg",
        },
      ],
    },
    requested_locale: "vi",
    content_locale: "vi",
    available_locales: ["vi", "en"],
    is_fallback: false,
    role: "Khach hang",
    location: "Da Nang",
    quote: "Dat khoe hon qua tung vu.",
    published_at: "2026-08-01T09:00:00Z",
    ...overrides,
  };
}
