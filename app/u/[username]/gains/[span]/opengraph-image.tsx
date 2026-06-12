import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseSpan, formatPeriod, gainsMessage } from "@/lib/gains";
import { formatNumber } from "@/lib/skills";
import { fetchHiscores } from "@/lib/hiscores";

export const runtime = "nodejs";
export const alt = "OSRS XP gains card";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string; span: string }>;
}) {
  const { username, span } = await params;
  const name = decodeURIComponent(username);
  const parsed = parseSpan(span);

  const fontDir = join(process.cwd(), "app/fonts");
  const bold = readFileSync(join(fontDir, "RuneScape-Bold-12.ttf"));
  const plain = readFileSync(join(fontDir, "RuneScape-Plain-12.ttf"));
  const spriteDir = join(process.cwd(), "public/sprites");
  const capeSrc = `data:image/png;base64,${readFileSync(
    join(spriteDir, "Max_cape_detail.png")
  ).toString("base64")}`;
  const coinsSrc = `data:image/png;base64,${readFileSync(
    join(spriteDir, "Coins_10000.png")
  ).toString("base64")}`;

  // Ironman badge next to the name (looks up the account's board membership).
  const badgeFiles: Record<string, string> = {
    ironman: "Ironman_chat_badge.png",
    hardcore: "Hardcore_ironman_chat_badge.png",
    ultimate: "Ultimate_ironman_chat_badge.png",
  };
  const acct = await fetchHiscores(name);
  const badgeFile = acct.ok ? badgeFiles[acct.accountType] : undefined;
  const badgeSrc = badgeFile
    ? `data:image/png;base64,${readFileSync(
        join(spriteDir, badgeFile)
      ).toString("base64")}`
    : null;

  const xp = parsed?.xp ?? 0;
  const days = parsed?.days ?? 0;
  const tier = gainsMessage(xp);
  // satori requires single-child text nodes unless a div is display:flex,
  // so compose these lines as plain strings.
  const headerLine = `${name} · OSRS gains`;
  const xpLine = `+${formatNumber(xp)} XP`;
  const gainedLine = `gained ${formatPeriod(days)}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 50,
          background: "radial-gradient(circle at 30% 20%, #2a1c0e, #1b1109 70%)",
          border: "14px solid #3e352b",
          boxShadow: "inset 0 0 0 6px #6b5a3e",
          fontFamily: "RS",
        }}
      >
        <img src={capeSrc} height={440} alt="" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: 680,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 4,
            }}
          >
            <img src={coinsSrc} width={40} height={40} alt="" />
            {badgeSrc ? <img src={badgeSrc} height={34} alt="" /> : null}
            <div style={{ fontSize: 32, color: "#c9b27f" }}>{headerLine}</div>
          </div>
          <div
            style={{
              fontFamily: "RSBold",
              fontSize: 104,
              color: "#4bd44b",
              textShadow: "4px 4px 0 #000",
              lineHeight: 1,
              marginTop: 8,
            }}
          >
            {xpLine}
          </div>
          <div style={{ fontSize: 40, color: "#ffce5c", marginTop: 14 }}>
            {gainedLine}
          </div>
          <div
            style={{
              fontFamily: "RSBold",
              fontSize: 40,
              color: "#ff981f",
              marginTop: 26,
            }}
          >
            {tier.label}
          </div>
          <div style={{ fontSize: 30, color: "#c9b27f", marginTop: 6, maxWidth: 660 }}>
            {tier.message}
          </div>
          <div style={{ fontSize: 26, color: "#ffff00", marginTop: 24 }}>
            hourstomax.davidcjw.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "RS", data: plain, weight: 400, style: "normal" },
        { name: "RSBold", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
