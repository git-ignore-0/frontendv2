import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  KnowledgeLayout,
  KnowledgeSection,
} from "@/components/knowledge-layout";
import { PageHero, TableWrap } from "@/components/primitives";
import { siteConfig } from "@/config/site";
import { getKnowledgeText } from "@/content/locales/knowledge-pages";
import { isLocale, languageAlternates } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: getKnowledgeText(locale, "animals.animals"),
    description: getKnowledgeText(
      locale,
      "animals.natural.behavior.housing.deep.bedding.feed.cycles.and",
    ),
    alternates: {
      canonical: `/${locale}/animals`,
      languages: languageAlternates("/animals"),
    },
  };
}
export default async function Animals({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const toc = [
    {
      id: "philosophy",
      label: getKnowledgeText(locale, "animals.natural.behavior"),
    },
    { id: "housing", label: getKnowledgeText(locale, "animals.housing") },
    { id: "bedding", label: getKnowledgeText(locale, "animals.deep.bedding") },
    { id: "pigs", label: getKnowledgeText(locale, "animals.pig.care") },
    { id: "chickens", label: getKnowledgeText(locale, "animals.chicken.care") },
    { id: "health", label: getKnowledgeText(locale, "animals.health.safety") },
  ];
  return (
    <>
      <PageHero
        eyebrow={getKnowledgeText(locale, "animals.animals")}
        title={getKnowledgeText(
          locale,
          "animals.a.good.environment.begins.with.natural.behavior",
        )}
        intro={getKnowledgeText(
          locale,
          "animals.housing.bedding.feed.and.daily.care.are.shaped",
        )}
        image="/images/piglets.png"
        alt={getKnowledgeText(
          locale,
          "animals.healthy.piglets.resting.on.straw.bedding",
        )}
        position="center 42%"
      />
      <KnowledgeLayout locale={locale} toc={toc}>
        <KnowledgeSection
          id="philosophy"
          index={getKnowledgeText(locale, "animals.01.welfare")}
          title={getKnowledgeText(
            locale,
            "animals.respect.the.animal.before.designing.the.system",
          )}
        >
          <div className="prose">
            <p>
              {getKnowledgeText(
                locale,
                "animals.natural.farming.livestock.systems.aim.for.low.input",
              )}
            </p>
            <p>
              {getKnowledgeText(
                locale,
                "animals.low.input.never.means.low.responsibility.stocking.density",
              )}
            </p>
          </div>
          <div className="cards">
            {[
              [
                "01",
                getKnowledgeText(locale, "animals.behavior"),
                getKnowledgeText(
                  locale,
                  "animals.make.room.for.movement.foraging.and.rest",
                ),
              ],
              [
                "02",
                getKnowledgeText(locale, "animals.climate"),
                getKnowledgeText(
                  locale,
                  "animals.use.airflow.shade.and.sunlight.deliberately",
                ),
              ],
              [
                "03",
                getKnowledgeText(locale, "animals.observation"),
                getKnowledgeText(
                  locale,
                  "animals.read.appetite.posture.manure.sound.and.social.behavior",
                ),
              ],
            ].map(([n, t, b]) => (
              <article className="card" key={n}>
                <p className="eyebrow">{n}</p>
                <h3>{t}</h3>
                <p>{b}</p>
              </article>
            ))}
          </div>
        </KnowledgeSection>
        <KnowledgeSection
          id="housing"
          index={getKnowledgeText(locale, "animals.02.housing")}
          title={getKnowledgeText(
            locale,
            "animals.a.building.that.breathes.with.the.climate",
          )}
        >
          <p>
            {getKnowledgeText(
              locale,
              "animals.legacy.pig.and.chicken.designs.use.an.east",
            )}
          </p>
          <figure>
            <Image
              src="/images/legacy/pig-house-design.png"
              alt={getKnowledgeText(
                locale,
                "animals.legacy.airflow.diagram.for.a.natural.farming.pig",
              )}
              width={1000}
              height={600}
            />
            <figcaption>
              {getKnowledgeText(
                locale,
                "animals.technical.diagram.from.the.legacy.knowledge.library",
              )}
            </figcaption>
          </figure>
          <ul>
            <li>
              {getKnowledgeText(
                locale,
                "animals.roof.overlap.protects.the.bedding.from.rain.while",
              )}
            </li>
            <li>
              {getKnowledgeText(
                locale,
                "animals.open.or.curtained.sides.allow.seasonal.control.without",
              )}
            </li>
            <li>
              {getKnowledgeText(
                locale,
                "animals.local.bamboo.timber.masonry.or.steel.may.be",
              )}
            </li>
          </ul>
          <figure>
            <Image
              src="/images/legacy/sample-pig-house.png"
              alt={getKnowledgeText(
                locale,
                "animals.examples.of.legacy.pig.house.structures",
              )}
              width={1100}
              height={650}
            />
          </figure>
        </KnowledgeSection>
        <KnowledgeSection
          id="bedding"
          index={getKnowledgeText(locale, "animals.03.deep.bedding")}
          title={getKnowledgeText(
            locale,
            "animals.the.floor.is.managed.as.a.living.layer",
          )}
        >
          <div className="prose">
            <p>
              {getKnowledgeText(
                locale,
                "animals.the.legacy.pig.system.describes.a.deep.layer",
              )}
            </p>
            <p>
              {getKnowledgeText(
                locale,
                "animals.bedding.is.not.maintenance.free.moisture.odor.compaction",
              )}
            </p>
          </div>
          <TableWrap
            label={getKnowledgeText(
              locale,
              "animals.deep.bedding.management.signals",
            )}
          >
            <table>
              <thead>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.observe")}</th>
                  <th>
                    {getKnowledgeText(locale, "animals.desired.condition")}
                  </th>
                  <th>{getKnowledgeText(locale, "animals.response")}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.moisture")}</th>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.tidy.friable.surface.without.wet.patches",
                    )}
                  </td>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.check.leaks.airflow.and.carbon.balance",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.odor")}</th>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.earthy.rather.than.sharp.ammonia",
                    )}
                  </td>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.reduce.loading.pressure.and.correct.wet.zones",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.behavior.2")}</th>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.animals.rest.and.forage.comfortably",
                    )}
                  </td>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.investigate.heat.injury.pests.and.footing",
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </KnowledgeSection>
        <KnowledgeSection
          id="pigs"
          index={getKnowledgeText(locale, "animals.04.pigs")}
          title={getKnowledgeText(
            locale,
            "animals.transition.feed.and.care.by.life.stage",
          )}
        >
          <p>
            {getKnowledgeText(
              locale,
              "animals.legacy.material.covers.selecting.healthy.piglets.estimating.weight",
            )}
          </p>
          <div className="media-prose">
            <figure>
              <Image
                src="/images/legacy/feed-process.png"
                alt={getKnowledgeText(
                  locale,
                  "animals.legacy.four.week.pig.feed.transition.diagram",
                )}
                width={760}
                height={500}
              />
              <figcaption>
                {getKnowledgeText(
                  locale,
                  "animals.historical.phase.out.diagram.adapt.with.a.qualified",
                )}
              </figcaption>
            </figure>
            <div>
              <h3>
                {getKnowledgeText(
                  locale,
                  "animals.six.stages.in.the.legacy.nutritive.cycle",
                )}
              </h3>
              <ol>
                <li>{getKnowledgeText(locale, "animals.weaned.piglets")}</li>
                <li>{getKnowledgeText(locale, "animals.growers")}</li>
                <li>
                  {getKnowledgeText(locale, "animals.gilts.before.pregnancy")}
                </li>
                <li>{getKnowledgeText(locale, "animals.gestating.sows")}</li>
                <li>{getKnowledgeText(locale, "animals.lactating.sows")}</li>
                <li>
                  {getKnowledgeText(locale, "animals.sows.returning.to.mating")}
                </li>
              </ol>
            </div>
          </div>
          <h3>
            {getKnowledgeText(
              locale,
              "animals.weight.estimation.retained.from.the.legacy.page",
            )}
          </h3>
          <p>
            {getKnowledgeText(
              locale,
              "animals.measure.heart.girth.and.body.length.in.metres",
            )}
          </p>
        </KnowledgeSection>
        <KnowledgeSection
          id="chickens"
          index={getKnowledgeText(locale, "animals.05.chickens")}
          title={getKnowledgeText(
            locale,
            "animals.dry.footing.fresh.air.and.room.to.scratch",
          )}
        >
          <div className="media-prose">
            <figure>
              <Image
                src="/images/chickens.png"
                alt={getKnowledgeText(
                  locale,
                  "animals.chickens.in.a.naturally.ventilated.farm.shelter",
                )}
                width={820}
                height={980}
              />
            </figure>
            <div className="prose">
              <p>
                {getKnowledgeText(
                  locale,
                  "animals.the.chicken.knowledge.covers.house.design.straw.bedding",
                )}
              </p>
              <p>
                {getKnowledgeText(
                  locale,
                  "animals.legacy.guidance.uses.body.heat.and.composting.warmth",
                )}
              </p>
            </div>
          </div>
          <figure>
            <Image
              src="/images/legacy/brooder-crib.jpg"
              alt={getKnowledgeText(
                locale,
                "animals.legacy.rounded.brooder.crib.diagram",
              )}
              width={900}
              height={600}
            />
          </figure>
          <TableWrap
            label={getKnowledgeText(
              locale,
              "animals.natural.farming.chicken.system.overview",
            )}
          >
            <table>
              <thead>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.element")}</th>
                  <th>{siteConfig.name}</th>
                  <th>
                    {getKnowledgeText(locale, "animals.management.question")}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.housing.2")}</th>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.ventilated.shelter.with.outdoor.access.where.safe",
                    )}
                  </td>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.are.birds.dry.shaded.and.protected",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.floor")}</th>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.dirt.and.chopped.straw.managed.for.dryness",
                    )}
                  </td>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.is.ammonia.or.compaction.developing",
                    )}
                  </td>
                </tr>
                <tr>
                  <th>{getKnowledgeText(locale, "animals.brooder")}</th>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.rounded.protected.and.sized.for.movement",
                    )}
                  </td>
                  <td>
                    {getKnowledgeText(
                      locale,
                      "animals.are.chicks.evenly.distributed.and.active",
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </TableWrap>
        </KnowledgeSection>
        <KnowledgeSection
          id="health"
          index={getKnowledgeText(locale, "animals.06.responsibility")}
          title={getKnowledgeText(
            locale,
            "animals.prevention.begins.with.observation.not.omission",
          )}
        >
          <div className="safety-panel">
            <h3>
              {getKnowledgeText(locale, "animals.animal.health.boundary")}
            </h3>
            <p>
              {getKnowledgeText(
                locale,
                "animals.natural.farming.does.not.replace.veterinary.diagnosis.vaccination",
              )}
            </p>
          </div>
          <ul>
            <li>
              {getKnowledgeText(
                locale,
                "animals.check.appetite.water.intake.manure.breathing.gait.skin",
              )}
            </li>
            <li>
              {getKnowledgeText(
                locale,
                "animals.keep.feed.changes.gradual.and.water.clean.and",
              )}
            </li>
            <li>
              {getKnowledgeText(
                locale,
                "animals.maintain.records.for.lineage.treatment.mortality.and.production",
              )}
            </li>
          </ul>
        </KnowledgeSection>
      </KnowledgeLayout>
    </>
  );
}
