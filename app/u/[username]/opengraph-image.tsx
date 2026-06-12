import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fetchHiscores } from "@/lib/hiscores";
import { computeHoursToMax, formatDuration, formatNumber } from "@/lib/skills";

export const runtime = "nodejs";
export const alt = "OSRS Hours to Max result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const name = decodeURIComponent(username);

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

  const res = await fetchHiscores(name);
  let headline = "Time to Max Calculator";
  let sub = "Look up any OSRS account";
  let totalLevelLine = "";
  if (res.ok) {
    const { totalHours, alreadyMaxed } = computeHoursToMax(res.progress, {});
    if (alreadyMaxed) {
      headline = "is MAXED!";
      sub = "All 23 skills at level 99";
    } else {
      headline = `${formatNumber(totalHours)} hours to max`;
      sub = `about ${formatDuration(totalHours)} of play`;
      totalLevelLine = `Total level ${formatNumber(res.totalLevel)}`;
    }
  }
  const displayName = res.ok ? res.username : name;

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
            maxWidth: 660,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 6,
            }}
          >
            <img src={coinsSrc} width={40} height={40} alt="" />
            <div style={{ fontSize: 34, color: "#c9b27f" }}>
              OSRS Hours to Max
            </div>
          </div>
          <div
            style={{
              fontFamily: "RSBold",
              fontSize: 64,
              color: "#ffce5c",
              textShadow: "3px 3px 0 #000",
              lineHeight: 1.05,
              marginTop: 6,
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontFamily: "RSBold",
              fontSize: 78,
              color: "#ff981f",
              textShadow: "4px 4px 0 #000",
              lineHeight: 1.05,
              marginTop: 10,
            }}
          >
            {headline}
          </div>
          <div style={{ fontSize: 36, color: "#ffce5c", marginTop: 16 }}>
            {sub}
          </div>
          {totalLevelLine ? (
            <div style={{ fontSize: 30, color: "#c9b27f", marginTop: 8 }}>
              {totalLevelLine}
            </div>
          ) : null}
          <div style={{ fontSize: 28, color: "#ffff00", marginTop: 28 }}>
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
