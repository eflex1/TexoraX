import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Globe, Users, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(222, 47%, 19%)', 'hsl(36, 90%, 55%)', 'hsl(160, 100%, 33%)', 'hsl(270, 50%, 55%)', 'hsl(200, 80%, 55%)'];

export default function ImpactReports() {
  const { user } = useCurrentUser();

  const { data: programmes = [] } = useQuery({
    queryKey: ['donor-programmes-impact', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Programme.list('-created_date', 100);
      return all.filter(p => p.donor_ids?.includes(user?.email) || p.donor_ids?.includes(user?.id));
    },
    enabled: !!user,
  });

  const { data: alumni = [] } = useQuery({
    queryKey: ['alumni-impact'],
    queryFn: () => base44.entities.Alumni.list('-created_date', 200),
  });

  const totalJobs = alumni.reduce((sum, a) => sum + (a.jobs_created || 0), 0);
  const totalFunding = alumni.reduce((sum, a) => sum + (a.funding_raised || 0), 0);

  const sdgData = programmes.reduce((acc, p) => {
    (p.sdg_alignments || []).forEach(sdg => {
      const existing = acc.find(item => item.name === sdg);
      if (existing) existing.value++;
      else acc.push({ name: sdg, value: 1 });
    });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Impact Reports" description="Programme outcomes, achievements, and SDG impact"
        actions={<Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export Report</Button>}
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Programmes Funded" value={programmes.length} icon={Target} tooltip="Total funded programmes" />
        <StatsCard title="Alumni Impact" value={alumni.length} icon={Users} tooltip="Programme graduates tracked" />
        <StatsCard title="Jobs Created" value={totalJobs} icon={TrendingUp} tooltip="Jobs created by alumni" />
        <StatsCard title="Funding Raised" value={`$${(totalFunding / 1000).toFixed(0)}k`} icon={Globe} tooltip="Post-programme funding raised" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">SDG Alignment Across Portfolio</CardTitle></CardHeader>
        <CardContent>
          <div className="h-56">
            {sdgData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sdgData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(160, 100%, 33%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No SDG data yet</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}