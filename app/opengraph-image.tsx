import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt =
  "OSRS Hours to Max — calculate how long until you max your Old School RuneScape account";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const fontDir = join(process.cwd(), "app/fonts");
  const bold = readFileSync(join(fontDir, "RuneScape-Bold-12.ttf"));
  const plain = readFileSync(join(fontDir, "RuneScape-Plain-12.ttf"));

  // Embed sprites as data URIs so satori renders them reliably.
  const spriteDir = join(process.cwd(), "public/sprites");
  const cape = readFileSync(join(spriteDir, "Max_cape_detail.png")).toString("base64");
  const coins = readFileSync(join(spriteDir, "Coins_10000.png")).toString("base64");
  const capeSrc = `data:image/png;base64,${cape}`;
  const coinsSrc = `data:image/png;base64,${coins}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, #2a1c0e, #1b1109 70%)",
          border: "14px solid #3e352b",
          boxShadow: "inset 0 0 0 6px #6b5a3e",
          fontFamily: "RS",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 48 }}>
          <img src={capeSrc} height={420} alt="" />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                marginBottom: 8,
              }}
            >
              <img src={coinsSrc} width={44} height={44} alt="" />
              <div
                style={{
                  fontFamily: "RSBold",
                  fontSize: 110,
                  color: "#ff981f",
                  textShadow: "4px 4px 0 #000",
                  lineHeight: 1,
                }}
              >
                Hours to Max
              </div>
            </div>
            <div
              style={{
                fontSize: 38,
                color: "#ffce5c",
                marginTop: 18,
                maxWidth: 620,
              }}
            >
              How long until 99 in every skill?
            </div>
            <div
              style={{
                fontSize: 30,
                color: "#c9b27f",
                marginTop: 14,
                maxWidth: 640,
              }}
            >
              Enter your username, pull your hiscores, set your XP/hr.
            </div>
            <div
              style={{
                fontSize: 30,
                color: "#ffff00",
                marginTop: 36,
              }}
            >
              hourstomax.davidcjw.com
            </div>
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
