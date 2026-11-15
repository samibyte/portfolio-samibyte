const NODE_W = 148;
const NODE_H = 56;
const GAP = 28;

export function Architecture({ nodes }: { nodes?: string[] }) {
  if (!nodes || nodes.length === 0) return null;

  const width = nodes.length * NODE_W + (nodes.length - 1) * GAP;

  return (
    <figure
      className="mt-8 overflow-x-auto pb-2"
      tabIndex={0}
      role="group"
      aria-label="Architecture diagram"
    >
      <svg
        role="img"
        aria-label={`Architecture: ${nodes.join(" to ")}`}
        width={width}
        height={NODE_H}
        viewBox={`0 0 ${width} ${NODE_H}`}
        className="h-20 w-auto max-w-none text-[var(--text)]"
      >
        {nodes.map((node, index) => {
          const x = index * (NODE_W + GAP);
          return (
            <g key={`${node}-${index}`}>
              {index > 0 ? (
                <line
                  x1={x - GAP}
                  y1={NODE_H / 2}
                  x2={x}
                  y2={NODE_H / 2}
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
              ) : null}
              <rect
                x={x}
                y={0}
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              />
              <text
                x={x + NODE_W / 2}
                y={NODE_H / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="currentColor"
                fontSize={14}
              >
                {node}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
