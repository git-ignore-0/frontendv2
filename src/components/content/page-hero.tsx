import Image from "next/image";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
};

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  imagePosition = "center",
}: PageHeroProps) {
  return (
    <header className="border-forest/10 border-b bg-warm">
      <div className="site-container grid min-h-[calc(88svh-var(--header-height))] items-center gap-10 py-10 md:grid-cols-12 md:py-14">
        <div className="hero-enter md:col-span-5 md:pr-8">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="display-title">{title}</h1>
          <p className="lead mt-7">{description}</p>
        </div>
        <div className="image-frame min-h-[22rem] md:col-span-7 md:min-h-[38rem]">
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority
            sizes="(min-width: 768px) 58vw, 100vw"
            className="object-cover"
            style={{ objectPosition: imagePosition }}
          />
          <div className="absolute bottom-0 left-0 bg-rice px-4 py-3 text-xs font-bold uppercase tracking-[0.13em] text-soil">
            Ảnh từ nông trại
          </div>
        </div>
      </div>
    </header>
  );
}
