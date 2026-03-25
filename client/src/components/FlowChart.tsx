interface FlowChartProps {
  totalSteps: number;
  completedSteps: number;
  accentColor?: string;
  mini?: boolean;
}

export default function FlowChart({
  totalSteps,
  completedSteps,
  accentColor = "#06b6d4",
  mini = false,
}: FlowChartProps) {
  const nodeSize = mini ? 20 : 32;
  const gap = mini ? 28 : 48;
  const svgWidth = nodeSize + (totalSteps - 1) * (nodeSize + gap) + 4;
  const svgHeight = nodeSize + 4;

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      style={{ overflow: "visible" }}
    >
      {Array.from({ length: totalSteps }).map((_, i) => {
        const isCompleted = i < completedSteps;
        const isCurrent = i === completedSteps && completedSteps < totalSteps;
        const cx = 2 + nodeSize / 2 + i * (nodeSize + gap);
        const cy = 2 + nodeSize / 2;

        return (
          <g key={i}>
            {i < totalSteps - 1 && (
              <line
                x1={cx + nodeSize / 2}
                y1={cy}
                x2={cx + nodeSize / 2 + gap}
                y2={cy}
                stroke={i < completedSteps ? accentColor : "hsl(215,20%,30%)"}
                strokeWidth={mini ? 1.5 : 2}
                strokeDasharray={i < completedSteps ? "none" : "4 2"}
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={nodeSize / 2}
              fill={
                isCompleted
                  ? accentColor
                  : isCurrent
                  ? "transparent"
                  : "transparent"
              }
              stroke={
                isCompleted
                  ? accentColor
                  : isCurrent
                  ? accentColor
                  : "hsl(215,20%,30%)"
              }
              strokeWidth={mini ? 1.5 : 2}
              opacity={isCurrent ? 1 : isCompleted ? 1 : 0.5}
            />
            {isCompleted && (
              <path
                d={`M${cx - nodeSize * 0.22} ${cy} l${nodeSize * 0.18} ${nodeSize * 0.18} l${nodeSize * 0.28} -${nodeSize * 0.3}`}
                stroke="hsl(222,47%,11%)"
                strokeWidth={mini ? 1.5 : 2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {!isCompleted && (
              <text
                x={cx}
                y={cy + (mini ? 4 : 5)}
                textAnchor="middle"
                fontSize={mini ? 8 : 12}
                fill={isCurrent ? accentColor : "hsl(215,20%,50%)"}
                fontWeight="600"
              >
                {i + 1}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
