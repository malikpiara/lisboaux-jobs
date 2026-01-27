'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

type LeaderboardEntry = {
  id: string;
  name: string;
  points: number;
};

type LeaderboardChartProps = {
  data: LeaderboardEntry[];
};

const chartConfig = {
  points: {
    label: 'Points',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export function LeaderboardChart({ data }: LeaderboardChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🏆 Contributor Leaderboard</CardTitle>
          <CardDescription>No contributions yet. Be the first!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🏆 Contributor Leaderboard</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ top: 16, right: 16, bottom: 16, left: 16 }}
          >
            <XAxis
              dataKey='name'
              type='category'
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              type='number'
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={40}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator='line' />}
            />
            <Bar
              dataKey='points'
              fill='var(--color-points)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
