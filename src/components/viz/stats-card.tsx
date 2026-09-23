import { resolveStats, type StatId, type StatValues } from "@/algorithms/core/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatGrid } from "@/components/viz/simple-complexity";

interface StatsCardProps {
  ids: readonly StatId[];
  values: StatValues;
  labels?: Partial<Record<StatId, string>> | undefined;
}

/** Shows only the statistics an algorithm declares it tracks. */
export function StatsCard({ ids, values, labels }: StatsCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <StatGrid items={resolveStats(ids, values, labels)} />
      </CardContent>
    </Card>
  );
}
