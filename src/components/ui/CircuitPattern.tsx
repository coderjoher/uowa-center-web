/**
 * The site's ornament: a fragment of circuit board. Thin traces run on the
 * horizontal and vertical with 45° chamfers, the way PCB routing does, and
 * end on solder pads; a small chip sits where several meet. It replaces the
 * earlier dash grid, whose squares said nothing about what the centre does.
 *
 * Gold pulses travel along some traces — data moving through the network —
 * drawn as short dashes on a copy of each path with `pathLength` normalised
 * to 100, so one keyframe (`circuit-pulse` in globals.css) moves every pulse
 * whatever its trace's length. Each pulse has its own duration and delay so
 * they never line up. Reduced motion hides the pulses.
 *
 * `tone` picks the line colour for the ground it sits on; the component is
 * decorative only and mirrors under RTL.
 */
type Pt = [number, number];

const TRACES: Pt[][] = [
  [[0, 60], [170, 60], [200, 90], [330, 90], [360, 60], [600, 60]],
  [[0, 140], [80, 140], [110, 170], [110, 250], [140, 280], [290, 280]],
  [[600, 150], [480, 150], [450, 180], [450, 250], [480, 280], [600, 280]],
  [[0, 340], [60, 340], [90, 370], [240, 370], [270, 340], [390, 340]],
  [[180, 200], [230, 200], [260, 170], [300, 170]],
  [[380, 170], [420, 170], [420, 120], [450, 90], [530, 90]],
  [[340, 250], [340, 300], [370, 330], [520, 330], [550, 360], [600, 360]],
  [[300, 0], [300, 40], [270, 70]],
  [[520, 0], [520, 30], [560, 30]],
  [[0, 220], [40, 220]],
];

/** Indexes of traces that carry a pulse, with [duration s, delay s]. */
const PULSES: [number, number, number][] = [
  [0, 5.5, 0],
  [1, 6.5, 1.8],
  [2, 6, 3.1],
  [3, 7, 0.9],
  [5, 4.5, 2.4],
  [6, 6, 4.2],
];

const d = (pts: Pt[]) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

export default function CircuitPattern({
  tone = "light",
  className = "",
}: {
  /** "light" for navy grounds, "dark" for white ones. */
  tone?: "light" | "dark";
  className?: string;
}) {
  const line = tone === "light" ? "rgb(255 255 255 / 0.16)" : "rgb(21 40 61 / 0.14)";
  const pad = tone === "light" ? "rgb(255 255 255 / 0.32)" : "rgb(21 40 61 / 0.26)";

  return (
    <svg
      aria-hidden
      viewBox="0 0 600 400"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={`circuit pointer-events-none rtl:-scale-x-100 ${className}`}
    >
      <g stroke={line} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        {TRACES.map((pts, i) => (
          <path key={i} d={d(pts)} />
        ))}
        {/* Chip with pins */}
        <rect x={300} y={150} width={80} height={100} rx={6} />
        {[170, 190, 210, 230].map((y) => (
          <path key={`l${y}`} d={`M292 ${y}H300`} />
        ))}
        {[170, 190, 210, 230].map((y) => (
          <path key={`r${y}`} d={`M380 ${y}H388`} />
        ))}
        {[320, 340, 360].map((x) => (
          <path key={`b${x}`} d={`M${x} 250V258`} />
        ))}
      </g>
      {/* Pads at trace ends that are not on the frame edge */}
      <g fill={pad}>
        {TRACES.flatMap((pts, i) =>
          [pts[0], pts[pts.length - 1]]
            .filter(([x, y]) => x > 0 && x < 600 && y > 0 && y < 400)
            .map(([x, y], k) => <circle key={`${i}-${k}`} cx={x} cy={y} r={3.5} />),
        )}
        <circle cx={330} cy={90} r={2.5} />
        <circle cx={110} cy={250} r={2.5} />
        <circle cx={450} cy={250} r={2.5} />
      </g>
      {/* Data pulses */}
      <g stroke="var(--gold)" strokeWidth={2} strokeLinecap="round" className="circuit-pulses">
        {PULSES.map(([i, dur, delay]) => (
          <path
            key={`p${i}`}
            d={d(TRACES[i])}
            pathLength={100}
            strokeDasharray="7 93"
            style={{ animationDuration: `${dur}s`, animationDelay: `${delay}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
