import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export interface ShapValue {
  feature: string;
  contribution: number; // positive or negative
}

interface ShapWaterfallProps {
  baseValue: number;
  shapValues: ShapValue[];
  finalScore: number;
}

export function ShapWaterfall({ baseValue, shapValues, finalScore }: ShapWaterfallProps) {
  // Sort by absolute contribution for better visualization
  const sorted = [...shapValues].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  // Calculate cumulative values for waterfall effect
  let cumulative = baseValue;
  const waterfallData = sorted.map((item) => {
    const start = cumulative;
    cumulative += item.contribution;
    // Clamp cumulative between 0 and 100
    cumulative = Math.max(0, Math.min(100, cumulative));
    return {
      feature: item.feature,
      contribution: Math.abs(cumulative - start),
      transparent: Math.min(start, cumulative),
      positive: cumulative >= start,
      isBase: false,
      isFinal: false,
      rawContribution: item.contribution
    };
  });

  // Add base value at start and final score at end
  const chartData = [
    {
      feature: "Base Score",
      transparent: 0,
      contribution: baseValue,
      positive: true,
      isBase: true,
      isFinal: false,
      rawContribution: baseValue
    },
    ...waterfallData,
    {
      feature: "Final Score",
      transparent: 0,
      contribution: finalScore,
      positive: true,
      isBase: false,
      isFinal: true,
      rawContribution: finalScore
    }
  ];

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle>Feature Attribution (SHAP)</CardTitle>
        <CardDescription>
          Shows how each deal feature contributed to the final score. Green = positive impact, Red = negative impact.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="feature"
                angle={-45}
                textAnchor="end"
                height={120}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                label={{ value: "Score (0-100)", angle: -90, position: "insideLeft", offset: 0 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: any, name: string, props: any) => {
                  if (props.payload.isBase) {
                    return [`Base: ${props.payload.contribution.toFixed(1)}`, "Score"];
                  }
                  if (props.payload.isFinal) {
                    return [`Final: ${props.payload.contribution.toFixed(1)}`, "Score"];
                  }
                  const rawVal = props.payload.rawContribution;
                  return [
                    `${rawVal >= 0 ? "+" : ""}${rawVal.toFixed(2)}`,
                    "Impact"
                  ];
                }}
              />
              {/* Stacked bars: first is transparent to float the waterfall bar, second is the actual bar */}
              <Bar dataKey="transparent" stackId="a" fill="transparent" legendType="none" />
              <Bar dataKey="contribution" stackId="a">
                {chartData.map((entry, index) => {
                  let fill = "#10b981"; // Green for positive impact
                  if (entry.isBase) fill = "#6b7280"; // Gray for base score
                  else if (entry.isFinal) fill = "#3b82f6"; // Blue for final score
                  else if (!entry.positive) fill = "#ef4444"; // Red for negative impact
                  return <Cell key={`cell-${index}`} fill={fill} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance Summary */}
        <div className="mt-8 space-y-3">
          <h4 className="font-semibold text-foreground">Top Contributing Features</h4>
          <div className="space-y-2">
            {sorted.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.feature}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      item.contribution >= 0 ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className={item.contribution >= 0 ? "text-green-600" : "text-red-600"}>
                    {item.contribution >= 0 ? "+" : ""}{item.contribution.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
