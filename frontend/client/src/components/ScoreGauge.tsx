import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreGaugeProps {
  score: number; // 0-100
  title?: string;
  description?: string;
}

export function ScoreGauge({ score, title = "Deal Quality Score", description = "Based on deal structure and historical comparables" }: ScoreGaugeProps) {
  // Determine color based on score - strict thresholds: red <40, amber 40-70, green >70
  const getColor = (value: number) => {
    if (value < 40) return { bg: "bg-red-500", text: "text-red-600", label: "At Risk" };
    if (value <= 70) return { bg: "bg-amber-500", text: "text-amber-600", label: "Moderate" };
    return { bg: "bg-green-500", text: "text-green-600", label: "Strong" };
  };

  const color = getColor(score);

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        {/* Gauge Container */}
        <div className="relative w-48 h-48 mb-6">
          {/* Background Circle */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Gauge background arc */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
              strokeDasharray="283"
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
            />
            {/* Gauge progress arc */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke={
                score < 40
                  ? "#ef4444"
                  : score <= 70
                    ? "#f59e0b"
                    : "#10b981"
              }
              strokeWidth="12"
              strokeDasharray={`${(score / 100) * 283} 283`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{
                transition: "stroke-dasharray 0.5s ease-in-out",
              }}
            />
            {/* Center text */}
            <text
              x="100"
              y="95"
              textAnchor="middle"
              fontSize="48"
              fontWeight="bold"
              fill="hsl(var(--foreground))"
            >
              {score}
            </text>
            <text
              x="100"
              y="120"
              textAnchor="middle"
              fontSize="14"
              fill="hsl(var(--muted-foreground))"
            >
              / 100
            </text>
          </svg>
        </div>

        {/* Status Label */}
        <div className={`px-4 py-2 rounded-lg ${color.bg} text-white font-semibold`}>
          {color.label}
        </div>

        {/* Score Interpretation */}
        <p className="text-center text-muted-foreground mt-6 max-w-xs">
          {score < 40
            ? "This deal carries significant execution risk. Market may be pricing in substantial deal-break probability."
            : score <= 70
              ? "This deal presents moderate risk. Comparable historical deals show mixed outcomes. Monitor key terms closely."
              : "This deal demonstrates strong fundamentals. Historical comparables with similar structures have shown positive outcomes."}
        </p>
      </CardContent>
    </Card>
  );
}
