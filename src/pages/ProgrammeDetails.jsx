import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import StatsCard from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Calendar, Users, Wallet, Target, FileText, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Funnel, FunnelChart } from 'recharts';

const COLORS = ['hsl(222, 47%, 19%)', 'hsl(36, 90%, 55%)', 'hsl(160, 100%, 33%)', 'hsl(270, 50%, 55%)', 'hsl(200, 80%, 55%)', 'hsl(340, 70%, 55%)'];

export default function ProgrammeDetails() {
  const { id } = useParams();
  const { user } = useCurrentUser();

  const { data: programme, isLoading } = useQuery({
    queryKey: ['programme', id],
    queryFn: async () => {
      const list = await base44.entities.Programme.filter({ id }, '-created_date', 1);
      return list[0];
    },
    enabled: !!id,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['programme-applications', id],
    queryFn: () => base44.entities.Application.filter({ programme_id: id }, '-created_date', 500),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!programme) {
    return <div className="text-center py-12 text-muted-foreground">Programme not found</div>;
  }

  const genderData = applications.reduce((acc, a) => {
    const g = a.gender || 'not_specified';
    const existing = acc.find(item => item.name === g);
    if (existing) existing.value++;
    else acc.push({ name: g, value: 1 });
    return acc;
  }, []);

  const sectorData = applications.reduce((acc, a) => {
    const s = a.sector || 'Other';
    const existing = acc.find(item => item.name === s);
    if (existing) existing.value++;
    else acc.push({ name: s, value: 1 });
    return acc;
  }, []);

  const statusCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const funnelData = [
    { name: 'Applied', value: applications.length },
    { name: 'Under Review', value: statusCounts.under_review || 0 },
    { name: 'Shortlisted', value: statusCounts.shortlisted || 0 },
    { name: 'Approved', value: statusCounts.approved || 0 },
    { name: 'Rejected', value: statusCounts.rejected || 0 },
  ];

  const approved = statusCounts.approved || 0;
  const budgetUtil = programme.total_budget > 0 ? '—' : '0%';
  const capacityFill = programme.max_participants > 0 ? ((approved / programme.max_participants) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-2xl font-bold tracking-tight">{programme.name}</h1>
          <StatusBadge status={programme.status} />
        </div>
        {programme.category && <p className="text-sm text-muted-foreground capitalize mb-1">{programme.category}</p>}
        {programme.objectives && <p className="text-sm text-muted-foreground">{programme.objectives}</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <TooltipProvider>
          {[
            { icon: Calendar, label: 'Start Date', value: programme.start_date ? format(new Date(programme.start_date), 'MMM d, yyyy') : 'TBD', tip: 'Programme start date' },
            { icon: Calendar, label: 'End Date', value: programme.end_date ? format(new Date(programme.end_date), 'MMM d, yyyy') : 'TBD', tip: 'Programme end date' },
            { icon: Calendar, label: 'Deadline', value: programme.application_deadline ? format(new Date(programme.application_deadline), 'MMM d, yyyy') : 'TBD', tip: 'Application deadline' },
            { icon: Wallet, label: 'Budget', value: `$${((programme.total_budget || 0) / 1000).toFixed(0)}k`, tip: 'Total programme budget' },
          ].map(item => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <item.icon className="h-3.5 w-3.5" />{item.label}
                  </div>
                  <p className="font-semibold">{item.value}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{item.tip}</p></TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      {programme.eligibility_criteria?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Eligibility Criteria</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5">
              {programme.eligibility_criteria.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />{c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {(user?.role === 'admin' || user?.role === 'donor') && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatsCard title="Total Applicants" value={applications.length} icon={FileText} tooltip="Total applications received" />
            <StatsCard title="Approved" value={approved} icon={Target} tooltip="Applications approved" />
            <StatsCard title="Capacity Fill" value={`${capacityFill}%`} icon={Users} tooltip="Participant capacity fill rate" />
            <StatsCard title="Under Review" value={statusCounts.under_review || 0} icon={BarChart3} tooltip="Applications currently under review" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Application Funnel</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="hsl(222, 47%, 19%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Gender Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56 flex items-center justify-center">
                  {genderData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                          {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground">No data</p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {sectorData.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Sector Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                      <ChartTooltip />
                      <Bar dataKey="value" fill="hsl(36, 90%, 55%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}