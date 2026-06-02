import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Calibration() {
  const { data: reviews = [] } = useQuery({
    queryKey: ['all-reviews'],
    queryFn: () => base44.entities.Review.list('-created_date', 500),
  });

  const reviewerStats = reviews.reduce((acc, r) => {
    const email = r.reviewer_email || 'unknown';
    if (!acc[email]) acc[email] = { scores: [], count: 0 };
    acc[email].scores.push(r.total_score || 0);
    acc[email].count++;
    return acc;
  }, {});

  const chartData = Object.entries(reviewerStats).map(([email, data]) => {
    const avg = data.scores.reduce((s, v) => s + v, 0) / data.scores.length;
    const variance = data.scores.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / data.scores.length;
    return {
      name: email.split('@')[0],
      average: Number(avg.toFixed(2)),
      reviews: data.count,
      stdDev: Number(Math.sqrt(variance).toFixed(2)),
    };
  });

  const groupMean = chartData.length > 0
    ? chartData.reduce((sum, d) => sum + d.average, 0) / chartData.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Calibration Tools" description="Monitor reviewer scoring patterns and apply normalization" />

      {reviews.length === 0 ? (
        <EmptyState icon={Scale} title="No review data" description="Calibration tools will be available once reviews are submitted" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Group Mean Score</p>
              <p className="text-2xl font-bold mt-1">{groupMean.toFixed(2)}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold mt-1">{reviews.length}</p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-muted-foreground">Active Reviewers</p>
              <p className="text-2xl font-bold mt-1">{chartData.length}</p>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Average Score by Reviewer</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="average" fill="hsl(222, 47%, 19%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Score Variance (Std Dev)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="stdDev" fill="hsl(36, 90%, 55%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}