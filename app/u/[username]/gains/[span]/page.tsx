import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { parseSpan, formatPeriod, gainsMessage } from "@/lib/gains";
import { formatNumber } from "@/lib/skills";

interface Props {
  params: Promise<{ username: string; span: string }>;
}

const resolve = cache((username: string, span: string) => ({
  name: decodeURIComponent(username),
  span: parseSpan(span),
}));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, span } = await params;
  const { name, span: parsed } = resolve(username, span);
  if (!parsed) return { title: `${name} — OSRS Hours to Max` };

  const tier = gainsMessage(parsed.xp);
  const title = `${name} gained ${formatNumber(parsed.xp)} XP ${formatPeriod(
    parsed.days
  )}`;
  const description = `${tier.label}: ${tier.message} — tracked on OSRS Hours to Max.`;
  const canonical = `/u/${encodeURIComponent(name)}/gains/${span}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function GainsPage({ params }: Props) {
  const { username, span } = await params;
  const { name, span: parsed } = resolve(username, span);

  // Malformed gains token — send them to the live profile instead of a 404.
  if (!parsed) redirect(`/u/${encodeURIComponent(name)}`);

  const tier = gainsMessage(parsed.xp);

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
      <header className="mb-6 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sprites/Max_cape_detail.png"
          alt="Max cape"
          className="rs-cape mb-1 h-16 w-auto sm:h-20"
        />
        <h1 className="rs-title text-2xl leading-tight sm:text-4xl">
          Hours&nbsp;to&nbsp;Max
        </h1>
      </header>

      {/* Gains scroll */}
      <section className="rs-parchment relative mb-6 overflow-hidden p-6 text-center sm:p-8">
        {[14, 38, 62, 86].map((left, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={left}
            src="/sprites/Coins_10000.png"
            alt=""
            aria-hidden="true"
            className="rs-rise-coin"
            style={{ left: `${left}%`, animationDelay: `${i * 0.5}s` }}
          />
        ))}
        <p className="rs-shadow text-base uppercase tracking-wider">{name}</p>
        <div
          className="rs-shadow mt-1 text-4xl font-bold sm:text-6xl"
          style={{ fontFamily: "var(--font-rs-bold)", color: "#1f6b1f" }}
        >
          +{formatNumber(parsed.xp)} XP
        </div>
        <p className="rs-shadow mt-2 text-lg sm:text-xl">
          gained {formatPeriod(parsed.days)}
        </p>
        <div className="mt-4">
          <span
            className="rs-shadow text-lg font-bold"
            style={{ fontFamily: "var(--font-rs-bold)", color: "#9a4b00" }}
          >
            {tier.label}
          </span>
          <p className="rs-shadow mt-1 text-base">{tier.message}</p>
        </div>
      </section>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/u/${encodeURIComponent(name)}`}
          className="rs-button px-5 py-2 text-base"
        >
          See {name}&apos;s live stats
        </Link>
        <Link href="/" className="rs-button px-5 py-2 text-base">
          Track your own gains ⚔
        </Link>
      </div>

      <footer className="rs-shadow mt-10 text-center text-xs text-[var(--rs-text-dim)]">
        <p>
          Fan project — not affiliated with or endorsed by Jagex. RuneScape is a
          trademark of Jagex Ltd.
        </p>
      </footer>
    </main>
  );
}
