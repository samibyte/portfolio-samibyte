const NODE_W = 148;
const NODE_H = 56;
const GAP = 28;
const LINE_HEIGHT = 17;
const MAX_CHARS_PER_LINE = 16;

/** Wrap a node label into lines that fit the 148px node box at 13px. */
function wrapLabel(label: string): string[] {
  const words = label.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const tentative = current ? `${current} ${word}` : word;

    if (tentative.length <= MAX_CHARS_PER_LINE) {
      current = tentative;
      continue;
    }

    if (current) lines.push(current);
    current = word; // a single over-long word starts its own line; it may still be the only line
  }

  if (current) lines.push(current);
  return lines;
}

export function Architecture({ nodes }: { nodes?: string[] }) {
  if (!nodes || nodes.length === 0) return null;

  const width = nodes.length * NODE_W + (nodes.length - 1) * GAP;

  return (
    <figure
      className="mt-6 overflow-x-auto pb-2"
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
        className="h-20 w-auto max-w-none text-[var(--text)] md:h-auto md:w-full"
      >
        {nodes.map((node, index) => {
          const x = index * (NODE_W + GAP);
          const lines = wrapLabel(node);
          const firstLineY =
            NODE_H / 2 - ((lines.length - 1) * LINE_HEIGHT) / 2;

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
              {lines.map((line, lineIndex) => (
                <text
                  key={lineIndex}
                  x={x + NODE_W / 2}
                  y={firstLineY + lineIndex * LINE_HEIGHT}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="currentColor"
                  fontSize={13}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
