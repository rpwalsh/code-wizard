/**
 * The landscape behind the glass.
 *
 * Drawn here rather than fetched, and drawn by hand rather than sourced. A
 * photograph would need a licence trail nobody can verify from inside the
 * repository, would have to be downloaded at some point, and would be the one
 * thing in a product that otherwise talks to nothing. Vector shapes cost four
 * kilobytes, scale to any display, and their provenance is this file.
 *
 * Pacific Northwest, late afternoon: layered ridgelines fading into haze, a
 * band of water, evergreens in the near ground. Every colour comes from a CSS
 * custom property, so the same geometry serves both themes — dawn light above
 * a pale inlet, or dusk with the ridges going blue.
 *
 * It is deliberately low contrast and slightly blurred. It is scenery, not
 * content: if you find yourself looking at it while working, it has failed.
 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg
        className="backdrop__scene"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-sky-high)" />
            <stop offset="55%" stopColor="var(--scene-sky-low)" />
            <stop offset="100%" stopColor="var(--scene-haze)" />
          </linearGradient>

          <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-water-far)" />
            <stop offset="100%" stopColor="var(--scene-water-near)" />
          </linearGradient>

          {/* Haze thickens toward the horizon, which is what makes distant
              ridges read as distant rather than merely paler. */}
          <linearGradient id="veil" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--scene-haze)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--scene-haze)" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />

        {/* A low sun, well off to one side and mostly swallowed by haze. */}
        <circle cx="1180" cy="286" r="54" fill="var(--scene-sun)" opacity="0.5" />

        {/* Four ridgelines. Each is nearer, darker and more jagged than the
            one behind it — the only depth cue the scene needs. */}
        <path
          d="M0 470 L150 402 L268 442 L392 356 L512 424 L640 372 L760 430 L900 366 L1030 428 L1170 380 L1320 436 L1460 392 L1600 444 L1600 900 L0 900 Z"
          fill="var(--scene-ridge-4)"
        />
        <path
          d="M0 528 L128 480 L246 520 L370 452 L500 512 L618 466 L742 522 L880 470 L1010 524 L1150 478 L1290 528 L1440 486 L1600 530 L1600 900 L0 900 Z"
          fill="var(--scene-ridge-3)"
        />
        <path
          d="M0 592 L140 552 L280 596 L420 540 L560 594 L700 548 L840 600 L980 552 L1120 602 L1260 556 L1400 604 L1600 566 L1600 900 L0 900 Z"
          fill="var(--scene-ridge-2)"
        />

        <rect y="600" width="1600" height="900" fill="url(#veil)" opacity="0.5" />

        {/* The inlet. Flat, because still water is the whole point. */}
        <rect y="612" width="1600" height="118" fill="url(#water)" />
        <g stroke="var(--scene-water-line)" strokeWidth="1.5" opacity="0.35">
          <line x1="120" y1="646" x2="470" y2="646" />
          <line x1="640" y1="662" x2="1010" y2="662" />
          <line x1="300" y1="690" x2="820" y2="690" />
          <line x1="960" y1="706" x2="1400" y2="706" />
        </g>

        {/* Near shore. */}
        <path d="M0 730 L1600 712 L1600 900 L0 900 Z" fill="var(--scene-ridge-1)" />

        {/* Evergreens along the shoreline. Two rows, the far one smaller and
            paler, so the treeline has depth without needing detail. */}
        <g fill="var(--scene-tree-far)" opacity="0.75">
          {farTrees.map((tree) => (
            <path key={`far-${tree.x}`} d={spruce(tree.x, 716, tree.height, tree.width)} />
          ))}
        </g>
        <g fill="var(--scene-tree-near)">
          {nearTrees.map((tree) => (
            <path key={`near-${tree.x}`} d={spruce(tree.x, 762, tree.height, tree.width)} />
          ))}
        </g>
      </svg>
    </div>
  );
}

/**
 * One conifer as a stack of three tapering triangles.
 *
 * Not a single triangle: the notches between the tiers are what stop a row of
 * these reading as bunting.
 */
function spruce(x: number, baseY: number, height: number, width: number): string {
  const tiers = [0, 1, 2].map((tier) => {
    const top = baseY - height + (height / 3.6) * tier;
    const spread = (width / 2) * (0.52 + 0.24 * tier);
    const bottom = baseY - height + (height / 2.6) * (tier + 1);
    return `M${x} ${top} L${x + spread} ${bottom} L${x - spread} ${bottom} Z`;
  });
  // A trunk, barely visible, but its absence is visible.
  tiers.push(
    `M${x - width * 0.06} ${baseY} L${x + width * 0.06} ${baseY} L${x + width * 0.06} ${baseY - height * 0.12} L${x - width * 0.06} ${baseY - height * 0.12} Z`,
  );
  return tiers.join(' ');
}

/** Irregular spacing, because evenly spaced trees read as a fence. */
const farTrees = [
  { x: 60, height: 54, width: 30 },
  { x: 132, height: 44, width: 25 },
  { x: 186, height: 62, width: 33 },
  { x: 268, height: 40, width: 23 },
  { x: 470, height: 58, width: 31 },
  { x: 536, height: 46, width: 26 },
  { x: 604, height: 66, width: 35 },
  { x: 690, height: 42, width: 24 },
  { x: 902, height: 60, width: 32 },
  { x: 968, height: 48, width: 27 },
  { x: 1044, height: 68, width: 36 },
  { x: 1128, height: 44, width: 25 },
  { x: 1338, height: 56, width: 30 },
  { x: 1404, height: 64, width: 34 },
  { x: 1486, height: 46, width: 26 },
  { x: 1552, height: 58, width: 31 },
];

const nearTrees = [
  { x: 34, height: 116, width: 58 },
  { x: 128, height: 92, width: 47 },
  { x: 208, height: 132, width: 66 },
  { x: 322, height: 84, width: 44 },
  { x: 402, height: 108, width: 55 },
  { x: 566, height: 96, width: 49 },
  { x: 654, height: 126, width: 63 },
  { x: 760, height: 88, width: 45 },
  { x: 1024, height: 104, width: 53 },
  { x: 1118, height: 134, width: 67 },
  { x: 1226, height: 90, width: 46 },
  { x: 1310, height: 112, width: 57 },
  { x: 1462, height: 98, width: 50 },
  { x: 1560, height: 128, width: 64 },
];
