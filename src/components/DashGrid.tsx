/**
 * The "dash grid" ornament used at the trailing edge of About and the leading
 * edge of Services. Bar offsets are inline-relative, so the grid mirrors with
 * the document direction.
 * Bars are 64x3 (horizontal) / 3x64 (vertical) on an 83px pitch, alternating
 * navy (#15283d) and pale blue (#e4f0f9).
 */
type Bar = [x: number, y: number, dir: "h" | "v", tone: "navy" | "pale"];

const ABOUT_BARS: Bar[] = [
  [0, 238, "h", "pale"],
  [83, 155, "h", "navy"],
  [83, 238, "h", "pale"],
  [166, 155, "h", "navy"],
  [166, 238, "h", "navy"],
  [249, 72, "h", "pale"],
  [249, 155, "h", "pale"],
  [249, 238, "h", "navy"],
  [72, 167, "v", "pale"],
  [72, 250, "v", "pale"],
  [155, 84, "v", "navy"],
  [155, 167, "v", "navy"],
  [155, 250, "v", "pale"],
  [238, 84, "v", "pale"],
  [238, 167, "v", "navy"],
  [238, 250, "v", "navy"],
  [321, 1, "v", "pale"],
  [321, 84, "v", "pale"],
];

const SERVICES_BARS: Bar[] = [
  [0, 155, "h", "navy"],
  [0, 238, "h", "pale"],
  [83, 72, "h", "pale"],
  [83, 155, "h", "navy"],
  [83, 238, "h", "pale"],
  [73, 84, "v", "navy"],
  [73, 167, "v", "navy"],
  [73, 250, "v", "pale"],
  [156, 1, "v", "pale"],
  [156, 84, "v", "pale"],
  [156, 167, "v", "pale"],
];

const TONE = { navy: "var(--navy)", pale: "var(--pale)" } as const;

function Bars({ bars, width, height, className }: { bars: Bar[]; width: number; height: number; className?: string }) {
  return (
    <div className={className} style={{ width, height }} aria-hidden>
      {bars.map(([x, y, dir, tone], i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            insetInlineStart: x,
            top: y,
            width: dir === "h" ? 64 : 3,
            height: dir === "h" ? 3 : 64,
            background: TONE[tone],
          }}
        />
      ))}
    </div>
  );
}

export function AboutDashGrid({ className }: { className?: string }) {
  return <Bars bars={ABOUT_BARS} width={324} height={313} className={className} />;
}

export function ServicesDashGrid({ className }: { className?: string }) {
  return <Bars bars={SERVICES_BARS} width={158} height={313} className={className} />;
}
