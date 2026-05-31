import { ImageResponse } from "next/og"

export function AppIconImage({ size }: { size: number }) {
  const stripeHeight = Math.max(4, Math.round(size * 0.06))
  const gaugeSize = Math.round(size * 0.38)

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          borderRadius: Math.round(size * 0.18),
        }}
      >
        <div
          style={{
            display: "flex",
            width: Math.round(size * 0.72),
            height: gaugeSize,
            borderRadius: gaugeSize / 2,
            border: `${Math.max(2, Math.round(size * 0.025))}px solid #444`,
            alignItems: "center",
            justifyContent: "center",
            color: "#f5f5f5",
            fontSize: Math.round(size * 0.22),
            fontWeight: 700,
          }}
        >
          M
        </div>
        <div
          style={{
            display: "flex",
            width: Math.round(size * 0.72),
            height: stripeHeight,
            marginTop: Math.round(size * 0.08),
            borderRadius: stripeHeight,
            overflow: "hidden",
          }}
        >
          <div style={{ flex: 1, background: "#dc2626" }} />
          <div style={{ flex: 1, background: "#facc15" }} />
          <div style={{ flex: 1, background: "#2563eb" }} />
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
