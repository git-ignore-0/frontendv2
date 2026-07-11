import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  KnowledgeLayout,
  KnowledgeSection,
} from "@/components/knowledge-layout";
import {
  LegacyFigure,
  PageHero,
  TableWrap,
  TextLink,
} from "@/components/primitives";
import { siteConfig } from "@/config/site";
import { plantInputs } from "@/content/knowledge";
import { getKnowledgeText } from "@/content/locales/knowledge-pages";
import { isLocale, languageAlternates, localizedPath } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: getKnowledgeText(locale, "plants.plants"),
    description: getKnowledgeText(
      locale,
      "plants.living.soil.farming.systems.and.an.index.of",
    ),
    alternates: {
      canonical: localizedPath(locale, "/plants"),
      languages: languageAlternates("/plants"),
    },
  };
}
export default async function Plants({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const legacyLabel = locale === "vi" ? "Tư liệu gốc" : "Legacy reference";
  const toc = [
    {
      id: "context",
      label: getKnowledgeText(locale, "plants.a.different.question"),
    },
    {
      id: "systems",
      label: getKnowledgeText(locale, "plants.farming.systems"),
    },
    { id: "soil", label: getKnowledgeText(locale, "plants.living.soil") },
    { id: "cycle", label: getKnowledgeText(locale, "plants.nutritive.cycle") },
    { id: "inputs", label: getKnowledgeText(locale, "plants.input.index") },
    {
      id: "practice",
      label: getKnowledgeText(locale, "plants.practice.with.care"),
    },
  ];
  return (
    <>
      <PageHero
        eyebrow={getKnowledgeText(locale, "plants.plants")}
        title={getKnowledgeText(
          locale,
          "plants.feed.the.soil.before.feeding.the.plant",
        )}
        intro={getKnowledgeText(
          locale,
          "plants.natural.farming.sees.plant.health.as.the.result",
        )}
        image="/images/green-beans.webp"
        alt={getKnowledgeText(
          locale,
          "plants.fresh.green.plants.growing.in.rich.soil",
        )}
        position="center 48%"
      />
      <KnowledgeLayout locale={locale} toc={toc}>
        <KnowledgeSection
          id="context"
          index={getKnowledgeText(locale, "plants.01.context")}
          title={getKnowledgeText(
            locale,
            "plants.a.different.way.begins.with.a.different.question",
          )}
        >
          <div className="prose">
            <p>
              {getKnowledgeText(
                locale,
                "plants.instead.of.asking.only.what.a.crop.lacks",
              )}
            </p>
            <p>
              {getKnowledgeText(
                locale,
                "plants.legacy.material.contrasts.ploughing.complete.weeding.and.purchased",
              )}
            </p>
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="systems"
          index={getKnowledgeText(locale, "plants.02.comparison")}
          title={getKnowledgeText(
            locale,
            "plants.conventional.organic.and.natural.farming",
          )}
        >
          <TableWrap
            label={getKnowledgeText(
              locale,
              "plants.comparison.of.farming.systems",
            )}
          >
            <table>
              <thead>
                <tr>
                  <th>{getKnowledgeText(locale, "plants.lens")}</th>
                  <th>{getKnowledgeText(locale, "plants.conventional")}</th>
                  <th>{getKnowledgeText(locale, "plants.organic")}</th>
                  <th>{siteConfig.name}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    getKnowledgeText(locale, "plants.inputs"),
                    getKnowledgeText(
                      locale,
                      "plants.commercial.fertilizers.and.crop.protection.products.may.be",
                    ),
                    getKnowledgeText(
                      locale,
                      "plants.inputs.follow.the.organic.standard.in.use",
                    ),
                    getKnowledgeText(
                      locale,
                      "plants.prioritizes.local.materials.and.farm.made.preparations",
                    ),
                  ],
                  [
                    getKnowledgeText(locale, "plants.soil.management"),
                    getKnowledgeText(
                      locale,
                      "plants.tillage.and.direct.control.are.common.tools",
                    ),
                    getKnowledgeText(
                      locale,
                      "plants.practices.vary.by.standard.and.farm.context",
                    ),
                    getKnowledgeText(
                      locale,
                      "plants.seeks.less.disturbance.and.more.biological.activity",
                    ),
                  ],
                  [
                    getKnowledgeText(locale, "plants.decision.making"),
                    getKnowledgeText(
                      locale,
                      "plants.often.follows.input.and.yield.schedules",
                    ),
                    getKnowledgeText(
                      locale,
                      "plants.combines.agronomy.with.certification.requirements",
                    ),
                    getKnowledgeText(
                      locale,
                      "plants.emphasizes.observation.and.ecological.relationships",
                    ),
                  ],
                ].map((r) => (
                  <tr key={r[0]}>
                    {r.map((c, i) =>
                      i === 0 ? <th key={c}>{c}</th> : <td key={c}>{c}</td>,
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </KnowledgeSection>
        <KnowledgeSection
          id="soil"
          index={getKnowledgeText(locale, "plants.03.foundation")}
          title={getKnowledgeText(locale, "plants.soil.is.a.place.of.exchange")}
        >
          <div className="media-prose feature-prose">
            <figure className="feature-figure">
              <Image
                src="/images/microscope.webp"
                alt={getKnowledgeText(
                  locale,
                  "plants.a.person.observing.a.sample.through.a.microscope",
                )}
                width={900}
                height={900}
              />
              <figcaption>
                {getKnowledgeText(
                  locale,
                  "plants.observation.connects.what.is.visible.above.ground.with",
                )}
              </figcaption>
            </figure>
            <div className="prose">
              <p>
                {getKnowledgeText(
                  locale,
                  "plants.roots.minerals.water.air.organic.matter.and.organisms",
                )}
              </p>
              <p>
                {getKnowledgeText(
                  locale,
                  "plants.indigenous.microorganisms.imo.are.central.in.the.legacy",
                )}
              </p>
            </div>
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="cycle"
          index={getKnowledgeText(locale, "plants.04.growth")}
          title={getKnowledgeText(
            locale,
            "plants.read.the.plant.s.changing.needs",
          )}
        >
          <p>
            {getKnowledgeText(
              locale,
              "plants.legacy.material.organizes.plant.development.into.vegetative.growth",
            )}
          </p>
          <LegacyFigure
            label={legacyLabel}
            caption={getKnowledgeText(
              locale,
              "plants.legacy.diagram.retained.for.knowledge.parity.terminology.and",
            )}
          >
            <Image
              src="/images/legacy/potato-cycle.png"
              alt={getKnowledgeText(
                locale,
                "plants.legacy.potato.growth.and.nutritive.cycle.diagram",
              )}
              width={900}
              height={520}
            />
          </LegacyFigure>
        </KnowledgeSection>
        <KnowledgeSection
          id="inputs"
          index={getKnowledgeText(locale, "plants.05.knowledge.index")}
          title={getKnowledgeText(
            locale,
            "plants.eight.names.commonly.encountered",
          )}
        >
          <p>
            {getKnowledgeText(
              locale,
              "plants.this.is.a.concept.map.not.a.recipe",
            )}
          </p>
          <div className="input-list premium-inputs">
            {plantInputs.map((input) => (
              <details key={input.code}>
                <summary>
                  <strong>{input.code}</strong>
                  <span>{input[locale].name}</span>
                  <i aria-hidden="true">+</i>
                </summary>
                <p>{input[locale].summary}</p>
              </details>
            ))}
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="practice"
          index={getKnowledgeText(locale, "plants.06.next.step")}
          title={getKnowledgeText(locale, "plants.begin.small.record.compare")}
        >
          <div className="prose">
            <p>
              {getKnowledgeText(
                locale,
                "plants.record.moisture.ground.cover.structure.volunteer.plants.insects",
              )}
            </p>
            <p>
              {getKnowledgeText(
                locale,
                "plants.learn.preparation.and.use.from.experienced.practitioners.and",
              )}
            </p>
          </div>
          <TextLink href={localizedPath(locale, "/about")}>
            {getKnowledgeText(locale, "plants.understand.our.approach")}
          </TextLink>
        </KnowledgeSection>
      </KnowledgeLayout>
    </>
  );
}
