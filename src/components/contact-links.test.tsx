import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContactLinks } from "@/components/contact-links";
import { getDictionary } from "@/content/dictionaries";
import type { PublicSiteSettings } from "@/lib/content-api";

const settings: PublicSiteSettings = {
  email: "",
  is_email_enabled: false,
  phone_display: "+84 97 151 91 85",
  is_phone_enabled: true,
  links: [],
};

describe("ContactLinks", () => {
  it("shows the enabled phone contact", () => {
    render(
      <ContactLinks dictionary={getDictionary("vi")} settings={settings} />,
    );

    expect(
      screen.getByRole("link", { name: /\+84 97 151 91 85/i }),
    ).toHaveAttribute("href", "tel:+84971519185");
  });
});
