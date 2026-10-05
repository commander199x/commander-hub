import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeasonDetail from "@/components/seasons/SeasonDetail";

type Props = { params: Promise<{ n: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params;
  return { title: `Season ${n}`, description: `Commander Season ${n}: champions, standings and awards.` };
}

export default async function SeasonPage({ params }: Props) {
  const { n } = await params;
  const num = Number(n);
  if (!Number.isInteger(num) || num < 1 || num > 999) notFound();
  return <SeasonDetail n={num} />;
}
