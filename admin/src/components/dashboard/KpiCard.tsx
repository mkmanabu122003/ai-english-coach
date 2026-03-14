import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
}

export function KpiCard({ title, value, subtitle, trend, icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{value}</p>
              {trend !== undefined && trend !== 0 && (
                <span
                  className={`inline-flex items-center text-sm font-medium ${
                    trend > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {trend > 0 ? (
                    <ArrowUp className="h-4 w-4 mr-0.5" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-0.5" />
                  )}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
