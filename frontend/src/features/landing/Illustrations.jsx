// Hand-made SVG illustrations: no image licence to manage, a few bytes each,
// and their colours come from the theme variables (see Illustrations.css),
// so they follow the light and dark modes. They are decorative only.

const decorative = { 'aria-hidden': true, focusable: 'false' }

export function HeroIllustration() {
  return (
    <svg className="ill" viewBox="0 0 440 340" {...decorative}>
      <circle className="ill-accent-bg" cx="250" cy="170" r="150" />

      {/* Tablet showing a weekly planning */}
      <rect
        className="ill-surface ill-border"
        x="110"
        y="60"
        width="260"
        height="190"
        rx="18"
        strokeWidth="2"
      />
      <rect
        className="ill-panel"
        x="126"
        y="76"
        width="228"
        height="22"
        rx="6"
      />
      <circle className="ill-accent" cx="140" cy="87" r="5" />
      <rect className="ill-muted" x="152" y="83" width="60" height="8" rx="4" />

      {[0, 1, 2, 3, 4].map((day) => (
        <rect
          key={day}
          className="ill-muted"
          x={142 + day * 44}
          y="110"
          width="24"
          height="6"
          rx="3"
        />
      ))}

      <rect
        className="ill-warm-bg"
        x="134"
        y="128"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-warm-bg"
        x="178"
        y="128"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-warm-bg"
        x="266"
        y="128"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-teal-bg"
        x="222"
        y="156"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-teal-bg"
        x="310"
        y="156"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-teal-bg"
        x="134"
        y="156"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-accent-bg ill-accent-stroke"
        x="178"
        y="184"
        width="38"
        height="18"
        rx="6"
        strokeWidth="1.5"
      />
      <rect
        className="ill-warm-bg"
        x="266"
        y="184"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-teal-bg"
        x="310"
        y="212"
        width="38"
        height="18"
        rx="6"
      />
      <rect
        className="ill-warm-bg"
        x="222"
        y="212"
        width="38"
        height="18"
        rx="6"
      />

      {/* Chef's hat */}
      <g transform="translate(40 168)">
        <circle
          className="ill-surface ill-border"
          cx="34"
          cy="34"
          r="22"
          strokeWidth="2"
        />
        <circle
          className="ill-surface ill-border"
          cx="62"
          cy="26"
          r="26"
          strokeWidth="2"
        />
        <circle
          className="ill-surface ill-border"
          cx="90"
          cy="34"
          r="22"
          strokeWidth="2"
        />
        <rect className="ill-surface" x="22" y="34" width="80" height="30" />
        <rect
          className="ill-surface ill-border"
          x="30"
          y="56"
          width="64"
          height="40"
          rx="6"
          strokeWidth="2"
        />
        <line
          className="ill-line"
          x1="48"
          y1="66"
          x2="48"
          y2="86"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          className="ill-line"
          x1="62"
          y1="66"
          x2="62"
          y2="86"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          className="ill-line"
          x1="76"
          y1="66"
          x2="76"
          y2="86"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* "Published" check */}
      <circle className="ill-accent" cx="372" cy="250" r="26" />
      <path
        className="ill-on-accent"
        d="M360 250 l8 8 l16 -17"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlanningIllustration() {
  return (
    <svg className="ill" viewBox="0 0 200 120" {...decorative}>
      <rect
        className="ill-surface ill-border"
        x="30"
        y="14"
        width="140"
        height="94"
        rx="12"
        strokeWidth="2"
      />
      <rect
        className="ill-accent"
        x="30"
        y="14"
        width="140"
        height="20"
        rx="10"
      />
      <rect className="ill-accent" x="30" y="24" width="140" height="10" />
      <circle className="ill-on-accent-fill" cx="62" cy="14" r="4" />
      <circle className="ill-on-accent-fill" cx="138" cy="14" r="4" />
      <rect
        className="ill-warm-bg"
        x="44"
        y="46"
        width="32"
        height="14"
        rx="5"
      />
      <rect
        className="ill-teal-bg"
        x="84"
        y="46"
        width="32"
        height="14"
        rx="5"
      />
      <rect
        className="ill-warm-bg"
        x="124"
        y="66"
        width="32"
        height="14"
        rx="5"
      />
      <rect
        className="ill-teal-bg"
        x="44"
        y="66"
        width="32"
        height="14"
        rx="5"
      />
      <rect
        className="ill-accent-bg"
        x="84"
        y="86"
        width="32"
        height="14"
        rx="5"
      />
    </svg>
  )
}

export function RulesIllustration() {
  return (
    <svg className="ill" viewBox="0 0 200 120" {...decorative}>
      <circle
        className="ill-surface ill-border"
        cx="88"
        cy="60"
        r="44"
        strokeWidth="2"
      />
      {[0, 90, 180, 270].map((angle) => (
        <rect
          key={angle}
          className="ill-muted"
          x="86"
          y="22"
          width="4"
          height="9"
          rx="2"
          transform={`rotate(${angle} 88 60)`}
        />
      ))}
      <line
        className="ill-line"
        x1="88"
        y1="60"
        x2="88"
        y2="36"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        className="ill-line"
        x1="88"
        y1="60"
        x2="106"
        y2="70"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle className="ill-accent" cx="88" cy="60" r="5" />
      <rect
        className="ill-warm-bg ill-warm-stroke"
        x="122"
        y="20"
        width="56"
        height="26"
        rx="8"
        strokeWidth="1.5"
      />
      <rect className="ill-warm" x="132" y="30" width="36" height="6" rx="3" />
      <path
        className="ill-accent"
        d="M150 66 l18 7 v14 c0 11 -8 18 -18 22 c-10 -4 -18 -11 -18 -22 v-14 z"
      />
      <path
        className="ill-on-accent"
        d="M142 87 l6 6 l11 -12"
        fill="none"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function InventoryIllustration() {
  return (
    <svg className="ill" viewBox="0 0 200 120" {...decorative}>
      <rect
        className="ill-muted"
        x="26"
        y="54"
        width="148"
        height="5"
        rx="2.5"
      />
      <rect
        className="ill-muted"
        x="26"
        y="104"
        width="148"
        height="5"
        rx="2.5"
      />
      <rect
        className="ill-warm-bg ill-warm-stroke"
        x="38"
        y="22"
        width="30"
        height="32"
        rx="6"
        strokeWidth="1.5"
      />
      <rect className="ill-warm" x="44" y="16" width="18" height="8" rx="3" />
      <rect
        className="ill-teal-bg ill-teal-stroke"
        x="76"
        y="30"
        width="36"
        height="24"
        rx="5"
        strokeWidth="1.5"
      />
      <line
        className="ill-teal-line"
        x1="94"
        y1="30"
        x2="94"
        y2="54"
        strokeWidth="1.5"
      />
      <rect
        className="ill-accent-bg ill-accent-stroke"
        x="120"
        y="26"
        width="20"
        height="28"
        rx="8"
        strokeWidth="1.5"
      />
      <rect
        className="ill-accent-bg ill-accent-stroke"
        x="144"
        y="26"
        width="20"
        height="28"
        rx="8"
        strokeWidth="1.5"
      />
      <rect
        className="ill-teal-bg ill-teal-stroke"
        x="38"
        y="74"
        width="40"
        height="30"
        rx="5"
        strokeWidth="1.5"
      />
      <rect
        className="ill-warm-bg ill-warm-stroke"
        x="86"
        y="80"
        width="26"
        height="24"
        rx="5"
        strokeWidth="1.5"
      />
      <rect
        className="ill-surface ill-border"
        x="124"
        y="66"
        width="44"
        height="32"
        rx="8"
        strokeWidth="2"
      />
      <rect
        className="ill-muted"
        x="132"
        y="76"
        width="28"
        height="5"
        rx="2.5"
      />
      <rect
        className="ill-warm"
        x="132"
        y="86"
        width="14"
        height="5"
        rx="2.5"
      />
    </svg>
  )
}

export function TeamIllustration() {
  const members = [
    { x: 56, tone: 'warm' },
    { x: 100, tone: 'accent' },
    { x: 144, tone: 'teal' },
  ]

  return (
    <svg className="ill" viewBox="0 0 200 120" {...decorative}>
      {members.map(({ x, tone }) => (
        <g key={x}>
          <path
            className={`ill-${tone}-bg ill-${tone}-stroke`}
            d={`M${x - 30} 108 c0 -24 13 -36 30 -36 c17 0 30 12 30 36 z`}
            strokeWidth="1.5"
          />
          <circle
            className="ill-surface ill-border"
            cx={x}
            cy="52"
            r="17"
            strokeWidth="2"
          />
        </g>
      ))}
      <g transform="translate(84 14)">
        <circle
          className="ill-surface ill-border"
          cx="9"
          cy="12"
          r="8"
          strokeWidth="1.5"
        />
        <circle
          className="ill-surface ill-border"
          cx="16"
          cy="8"
          r="9"
          strokeWidth="1.5"
        />
        <circle
          className="ill-surface ill-border"
          cx="24"
          cy="12"
          r="8"
          strokeWidth="1.5"
        />
        <rect
          className="ill-surface ill-border"
          x="6"
          y="15"
          width="21"
          height="10"
          rx="3"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  )
}

export function PaperIcon() {
  return (
    <svg className="ill ill--icon" viewBox="0 0 64 64" {...decorative}>
      <path
        className="ill-surface ill-border"
        d="M16 8 h24 l10 10 v38 h-34 z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        className="ill-line"
        d="M23 28 h20 M23 36 h20 M23 44 h12"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path className="ill-warm" d="M38 40 l12 -12 l4 4 l-12 12 l-6 2 z" />
    </svg>
  )
}

export function BoxesIcon() {
  return (
    <svg className="ill ill--icon" viewBox="0 0 64 64" {...decorative}>
      <rect
        className="ill-teal-bg ill-teal-stroke"
        x="8"
        y="30"
        width="24"
        height="24"
        rx="4"
        strokeWidth="2"
      />
      <rect
        className="ill-warm-bg ill-warm-stroke"
        x="32"
        y="30"
        width="24"
        height="24"
        rx="4"
        strokeWidth="2"
      />
      <rect
        className="ill-accent-bg ill-accent-stroke"
        x="20"
        y="8"
        width="24"
        height="22"
        rx="4"
        strokeWidth="2"
      />
      <text
        className="ill-text"
        x="32"
        y="25"
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
      >
        ?
      </text>
    </svg>
  )
}

export function LabelIcon() {
  return (
    <svg className="ill ill--icon" viewBox="0 0 64 64" {...decorative}>
      <path
        className="ill-surface ill-border"
        d="M10 18 h30 l14 14 l-14 14 h-30 z"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        className="ill-border"
        cx="44"
        cy="32"
        r="3"
        fill="none"
        strokeWidth="2"
      />
      <path
        className="ill-line"
        d="M17 28 h16 M17 36 h10"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle className="ill-warm" cx="50" cy="50" r="9" />
      <path
        className="ill-on-accent"
        d="M50 45 v6 M50 54 v0.5"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
