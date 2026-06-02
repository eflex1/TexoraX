import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useLanguage } from '@/lib/LanguageContext';
import StatsCard from '@/components/shared/StatsCard';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { FolderKanban, FileText, Users, Wallet, Plus, ArrowRight, TrendingUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(258, 80%, 55%)', 'hsl(36, 90%, 55%)', 'hsl(160, 100%, 33%)', 'hsl(200, 80%, 55%)', 'hsl(0, 84%, 60%)'];

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const [selectedProgrammeId, setSelectedProgrammeId] = useState('all');

  const { data: programmes = [] } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.Application.list('-created_date', 500),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ['disbursements'],
    queryFn: () => base44.entities.Disbursement.list('-created_date', 100),
  });

  // Filter applications by selected programme
  const applications = selectedProgrammeId === 'all'
    ? allApplications
    : allApplications.filter(a => a.programme_id === selectedProgrammeId);

  const selectedProgramme = programmes.find(p => p.id === selectedProgrammeId);
  const activeProgrammes = programmes.filter(p => !['draft', 'archived', 'completion'].includes(p.status));
  const pendingApps = applications.filter(a => a.status === 'submitted' || a.status === 'under_review');

  const totalBudget = selectedProgrammeId === 'all'
    ? programmes.reduce((sum, p) => sum + (p.total_budget || 0), 0)
    : (selectedProgramme?.total_budget || 0);

  const totalDisbursed = disbursements
    .filter(d => d.status === 'completed' && (selectedProgrammeId === 'all' || d.programme_id === selectedProgrammeId))
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const funnelData = [
    { name: 'Submitted', value: statusCounts.submitted || 0 },
    { name: 'Under Review', value: statusCounts.under_review || 0 },
    { name: 'Shortlisted', value: statusCounts.shortlisted || 0 },
    { name: 'Approved', value: statusCounts.approved || 0 },
    { name: 'Rejected', value: statusCounts.rejected || 0 },
  ];

  const programmeStatusData = programmes.reduce((acc, p) => {
    const existing = acc.find(item => item.name === (p.status || 'draft'));
    if (existing) existing.value++;
    else acc.push({ name: p.status || 'draft', value: 1 });
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t('welcome')}, ${user?.full_name?.split(' ')[0] || 'Admin'} 👋`}
        description="Here's what's happening across your programmes"
        actions={
          <div className="flex items-center gap-2">
            {/* Programme toggle */}
            <Select value={selectedProgrammeId} onValueChange={setSelectedProgrammeId}>
              <SelectTrigger className="w-52 bg-white border-gray-200 shadow-sm">
                <FolderKanban className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder={t('all_programmes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_programmes')}</SelectItem>
                {programmes.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[160px]">{p.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Link to="/programmes/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" /> {t('new_programme')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Programme context banner */}
      {selectedProgrammeId !== 'all' && selectedProgramme && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
          <FolderKanban className="h-4 w-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{selectedProgramme.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{selectedProgramme.category} · {selectedProgramme.status}</p>
          </div>
          <StatusBadge status={selectedProgramme.status} />
          <Button variant="ghost" size="sm" onClick={() => setSelectedProgrammeId('all')}>All</Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title={t('active_programmes')} value={activeProgrammes.length} icon={FolderKanban}
          tooltip="Number of programmes currently in progress" />
        <StatsCard title={t('pending_applications')} value={pendingApps.length} icon={FileText}
          tooltip="Applications awaiting review" trend={`${applications.length} total`} trendUp />
        <StatsCard title={t('total_budget')} value={`$${(totalBudget / 1000).toFixed(0)}k`} icon={Wallet}
          tooltip="Sum of all programme budgets" />
        <StatsCard title={t('disbursed')} value={`$${(totalDisbursed / 1000).toFixed(0)}k`} icon={TrendingUp}
          tooltip="Total amount disbursed to participants"
          subtitle={totalBudget > 0 ? `${((totalDisbursed / totalBudget) * 100).toFixed(1)}% utilized` : '0%'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Application Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(258, 80%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Programme Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {programmeStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={programmeStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                      outerRadius={90} innerRadius={50} paddingAngle={3}>
                      {programmeStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No programme data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">{t('recent_applications')}</CardTitle>
            <Link to="/applications" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.slice(0, 5).map(app => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{app.applicant_name || app.applicant_email}</p>
                    <p className="text-xs text-muted-foreground">{app.programme_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    {app.submission_date && (
                      <span className="text-xs text-muted-foreground">{format(new Date(app.submission_date), 'MMM d')}</span>
                    )}
                  </div>
                </div>
              ))}
              {applications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No applications yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('quick_actions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: t('new_programme'), icon: Plus, path: '/programmes/create' },
                { label: 'Review Applications', icon: FileText, path: '/applications' },
                { label: 'Manage Users', icon: Users, path: '/users' },
                { label: 'View Analytics', icon: TrendingUp, path: '/analytics' },
              ].map(action => (
                <Link key={action.path} to={action.path}>
                  <Button variant="ghost" className="w-full justify-start h-10 text-sm">
                    <action.icon className="h-4 w-4 mr-3 text-muted-foreground" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}