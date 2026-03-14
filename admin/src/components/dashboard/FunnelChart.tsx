import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FunnelStep {
  label: string;
  value: number;
  rate: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
}

const FUNNEL_COLORS = [
  "bg-blue-500",
  "bg-blue-400",
  "bg-blue-300",
  "bg-blue-200",
];

export function FunnelChart({ data }: FunnelChartProps) {
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ファネル分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((step, index) => {
            const widthPercent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
            return (
              <div key={step.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{step.value.toLocaleString()}</span>
                    {index > 0 && (
                      <span className="text-muted-foreground text-xs">
                        ({step.rate})
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-8 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${FUNNEL_COLORS[index % FUNNEL_COLORS.length]} transition-all duration-500`}
                    style={{ width: `${Math.max(widthPercent, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground">
          {data.map((step, index) => (
            <span key={step.label} className="flex items-center gap-1">
              {step.label}
              {index < data.length - 1 && <span className="mx-1">→</span>}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
