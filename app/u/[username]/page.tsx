import { cache } from "react";
import type { Metadata } from "next";
import Calculator from "@/app/Calculator";
import { fetchHiscores } from "@/lib/hiscores";
import { getShareCount } from "@/lib/shares";
import { computeHoursToMax, formatDuration, formatNumber } from "@/lib/skills";

interface Props {
  params: Promise<{ username: string }>;
}

// Dedupe the hiscores lookup across generateMetadata + the page render.
const getHiscores = cache((name: string) => fetchHiscores(name));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const name = decodeURIComponent(username);
  const res = await getHiscores(name);

  if (!res.ok) {
    const title = `${name} — OSRS Hours to Max`;
    const description = `Look up ${name}'s Old School RuneScape stats and see how long until they max.`;
    return {
      title,
      description,
      alternates: { canonical: `/u/${encodeURIComponent(name)}` },
    };
  }

  const { totalHours, alreadyMaxed } = computeHoursToMax(res.progress, {});
  const title = alreadyMaxed
    ? `${res.username} is MAXED`
    : `${res.username} — ${formatNumber(totalHours)} hours to max`;
  const description = alreadyMaxed
    ? `${res.username} has maxed all 23 skills (level 99) in Old School RuneScape.`
    : `${res.username} (total level ${formatNumber(
        res.totalLevel
      )}) needs ${formatNumber(totalHours)} hours — about ${formatDuration(
        totalHours
      )} of play — to max their OSRS account.`;
  const canonical = `/u/${encodeURIComponent(res.username)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function UserPage({ params }: Props) {
  const { username } = await params;
  const name = decodeURIComponent(username);
  const [res, shareCount] = await Promise.all([
    getHiscores(name),
    getShareCount(),
  ]);

  if (!res.ok) {
    // Unknown/invalid name: prefill so the visitor sees the error and can retry.
    return (
      <Calculator
        initialUsername={name}
        initialError={res.error}
        initialShareCount={shareCount}
      />
    );
  }

  return (
    <Calculator
      initialData={{
        username: res.username,
        totalLevel: res.totalLevel,
        progress: res.progress,
      }}
      initialShareCount={shareCount}
    />
  );
}
