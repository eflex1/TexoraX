import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, FileText, Users, TrendingUp, Download, GraduationCap, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['hsl(258, 80%, 55%)', 'hsl(36, 90%, 55%)', 'hsl(160, 100%, 33%)', 'hsl(200, 80%, 55%)', 'hsl(0, 84%, 60%)', 'hsl(270, 50%, 55%)'];

export default function Analytics() {
  const [progFilter, setProgFilter] = useState('all');

  const { data: programmes = [] } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const { data: allApplications = [] } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.Application.list('-created_date', 500),
  });

  const { data: alumni = [] } = useQuery({
    queryKey: ['alumni'],
    queryFn: () => base44.entities.Alumni.list('-created_date', 500),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ['disbursements'],
    queryFn: () => base44.entities.Disbursement.list('-created_date', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  const applications = progFilter === 'all' ? allApplications : allApplications.filter(a => a.programme_id === progFilter);

  const statusData = Object.entries(
    applications.reduce((acc, a) => { acc[a.status || 'unknown'] = (acc[a.status || 'unknown'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const sectorData = Object.entries(
    applications.reduce((acc, a) => { const s = a.sector || 'Other'; acc[s] = (acc[s] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

  const categoryData = Object.entries(
    programmes.reduce((acc, p) => { acc[p.category || 'other'] = (acc[p.category || 'other'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const genderData = Object.entries(
    applications.reduce((acc, a) => { const g = a.gender || 'unspecified'; acc[g] = (acc[g] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const userRoleData = Object.entries(
    users.reduce((acc, u) => { acc[u.role || 'user'] = (acc[u.role || 'user'] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const alumniCohortData = Object.entries(
    alumni.reduce((acc, a) => { const c = a.cohort || 'No Cohort'; acc[c] = (acc[c] || 0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value }));

  const approvedRate = applications.length > 0
    ? ((applications.filter(a => a.status === 'approved').length / applications.length) * 100).toFixed(1) : '0';

  const totalDisbursed = disbursements.filter(d => d.status === 'completed').reduce((s, d) => s + (d.amount || 0), 0);

  const exportCSV = (data, filename) => {
    if (data.length === 0) { toast.error('No data to export'); return; }
    const keys = Object.keys(data[0]);
    const rows = [keys, ...data.map(r => keys.map(k => `"${r[k] || ''}"`))];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
    toast.success('Exported');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Platform performance metrics and insights across all modules"
        actions={
          <div className="flex gap-2">
            <Select value={progFilter} onValueChange={setProgFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Programmes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programmes</SelectItem>
                {programmes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Programmes" value={programmes.length} icon={BarChart3} tooltip="All programmes" />
        <StatsCard title="Applications" value={applications.length} icon={FileText} tooltip="Filtered applications" />
        <StatsCard title="Approval Rate" value={`${approvedRate}%`} icon={TrendingUp} tooltip="Application approval rate" />
        <StatsCard title="Total Users" value={users.length} icon={Users} tooltip="Platform users" />
      </div>

      <Tabs defaultValue="applications">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="programmes">Programmes</TabsTrigger>
          <TabsTrigger value="alumni">Alumni</TabsTrigger>
          <TabsTrigger value="grants">Grants</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(applications, 'applications.csv')}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3}>
                        {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Sector Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectorData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(36, 90%, 55%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Gender Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genderData}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(258, 80%, 55%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programmes" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(programmes, 'programmes.csv')}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Programme Categories</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(222, 47%, 19%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alumni" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(alumni, 'alumni.csv')}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <StatsCard title="Total Alumni" value={alumni.length} icon={GraduationCap} />
            <StatsCard title="Jobs Created" value={alumni.reduce((s, a) => s + (a.jobs_created || 0), 0)} icon={Users} />
            <StatsCard title="Funding Raised" value={`$${(alumni.reduce((s, a) => s + (a.funding_raised || 0), 0) / 1000).toFixed(0)}k`} icon={TrendingUp} />
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Alumni by Cohort</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alumniCohortData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(160, 100%, 33%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grants" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(disbursements, 'disbursements.csv')}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <StatsCard title="Total Disbursements" value={disbursements.length} icon={Wallet} />
            <StatsCard title="Total Disbursed" value={`₦${(totalDisbursed / 1000).toFixed(0)}k`} icon={TrendingUp} />
            <StatsCard title="Completion Rate" value={disbursements.length > 0 ? `${((disbursements.filter(d => d.status === 'completed').length / disbursements.length) * 100).toFixed(0)}%` : '0%'} icon={BarChart3} />
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Disbursements by Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={Object.entries(disbursements.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value }))}
                      dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={45} paddingAngle={3}>
                      {disbursements.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => exportCSV(users.map(u => ({ email: u.email, name: u.full_name, role: u.role, organization: u.organization })), 'users.csv')}>
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Users by Role</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userRoleData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(270, 50%, 55%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}