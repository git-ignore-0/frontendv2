import type { Metadata } from "next";

import WorkshopDetailPage, {
  generateMetadata as generateWorkshopDetailMetadata,
} from "@/features/workshops/workshop-detail-page";

type RouteParams = Promise<{ segment: string; locale: string }>;

async function detailParams(params: RouteParams) {
  const { segment, locale } = await params;
  return { slug: segment, locale };
}

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  return generateWorkshopDetailMetadata({
    params: detailParams(params),
  });
}

export default async function WorkshopDetailRoute({
  params,
}: {
  params: RouteParams;
}) {
  return <WorkshopDetailPage params={detailParams(params)} />;
}
