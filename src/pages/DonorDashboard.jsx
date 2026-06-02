import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import StatsCard from '@/components/shared/StatsCard';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import DonorPDFExport from '@/components/donor/DonorPDFExport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import {
  Wallet, TrendingUp, Target, Globe, ArrowRight,
  Users, Briefcase, ChevronRight, DollarSign, CheckCircle2
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, Legend
} from 'recharts';

const COLORS = ['hsl(222, 47%, 19%)', 'hsl(36, 90%, 55%)', 'hsl(160, 100%, 33%)', 'hsl(270, 50%, 55%)', 'hsl(200, 80%, 55%)', 'hsl(0, 80%, 55%)'];

function formatNGN(val) {
  if (!val) return '₦0';
  if (val >= 1_000_000) return `₦${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `₦${(val / 1_000).toFixed(0)}k`;
  return `₦${val.toLocaleString()}`;
}

export default function DonorDashboard() {
  const { user } = useCurrentUser();
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const { data: programmes = [] } = useQuery({
    queryKey: ['donor-programmes', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Programme.list('-created_date', 100);
      return all.filter(p => p.donor_ids?.includes(user?.email) || p.donor_ids?.includes(user?.id));
    },
    enabled: !!user,
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ['donor-disbursements'],
    queryFn: () => base44.entities.Disbursement.list('-created_date', 200),
  });

  const { data: alumni = [] } = useQuery({
    queryKey: ['donor-alumni'],
    queryFn: () => base44.entities.Alumni.list('-created_date', 200),
  });

  const totalFunding = programmes.reduce((sum, p) => sum + (p.total_budget || 0), 0);
  const totalDisbursed = disbursements.filter(d => d.status === 'completed').reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalJobs = alumni.reduce((s, a) => s + (a.jobs_created || 0), 0);
  const totalFundingRaised = alumni.reduce((s, a) => s + (a.funding_raised || 0), 0);

  const sdgData = programmes.reduce((acc, p) => {
    (p.sdg_alignments || []).forEach(sdg => {
      const existing = acc.find(item => item.name === sdg);
      if (existing) existing.value++;
      else acc.push({ name: sdg, value: 1 });
    });
    return acc;
  }, []);

  const sectorData = alumni.reduce((acc, a) => {
    if (a.sector) {
      const existing = acc.find(item => item.name === a.sector);
      if (existing) existing.value++;
      else acc.push({ name: a.sector, value: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Donor'}`}
        description="Your portfolio overview and impact metrics"
        actions={
          <DonorPDFExport
            programmes={programmes}
            disbursements={disbursements}
            alumni={alumni}
          />
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Funded Programmes" value={programmes.length} icon={Target}
          tooltip="Number of programmes you are funding" />
        <StatsCard title="Total Committed" value={formatNGN(totalFunding)} icon={Wallet}
          tooltip="Total funding committed across programmes" />
        <StatsCard title="Total Disbursed" value={formatNGN(totalDisbursed)} icon={TrendingUp}
          tooltip="Total amount disbursed to participants" />
        <StatsCard title="SDG Goals" value={new Set(programmes.flatMap(p => p.sdg_alignments || [])).size} icon={Globe}
          tooltip="Unique SDG goals aligned across your portfolio" />
      </div>

      {/* Alumni Impact */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Alumni Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Total Alumni', value: alumni.length, color: 'text-gray-900' },
              { label: 'Jobs Created', value: totalJobs, color: 'text-emerald-600' },
              { label: 'Funding Raised', value: formatNGN(totalFundingRaised), color: 'text-indigo-600' },
              { label: 'Active', value: alumni.filter(a => a.current_status === 'active').length, color: 'text-blue-600' },
            ].map(s => (
              <div key={s.label} className="bg-muted/50 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Alumni table */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Company Impact Breakdown</h3>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Company</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden sm:table-cell">Programme / Cohort</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">Jobs</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground hidden md:table-cell">Funding Raised</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">SDGs</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {alumni.slice(0, 8).map(al => (
                    <tr key={al.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{al.organization_name || al.name}</p>
                        <p className="text-xs text-muted-foreground">{al.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs">{al.programme_name || '—'}</p>
                        {al.cohort && <Badge variant="outline" className="text-[10px] mt-0.5">{al.cohort}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{al.jobs_created || 0}</td>
                      <td className="px-4 py-3 text-right font-medium text-indigo-600 hidden md:table-cell">{formatNGN(al.funding_raised)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-xs text-muted-foreground">{al.kpis?.sdg_count || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedAlumni(al)} className="p-1 rounded hover:bg-muted">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {alumni.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No alumni data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> SDG Portfolio Alignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {sdgData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sdgData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Programmes" fill="hsl(222, 47%, 19%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No SDG data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Alumni by Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {sectorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No sector data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funded Programmes */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Funded Programmes</CardTitle>
          <Link to="/programmes" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {programmes.slice(0, 5).map(prog => (
              <Link key={prog.id} to={`/programmes/${prog.id}`} className="block">
                <div className="flex items-center justify-between py-2.5 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-medium">{prog.name}</p>
                    <p className="text-xs text-muted-foreground">{prog.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatNGN(prog.total_budget)}</span>
                    <StatusBadge status={prog.status} />
                  </div>
                </div>
              </Link>
            ))}
            {programmes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No funded programmes yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Disbursements (view only) */}
      {disbursements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent Disbursements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {disbursements.slice(0, 6).map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{d.recipient_name || 'Recipient'}</p>
                    <p className="text-xs text-muted-foreground">{d.milestone_name || d.notes || 'Grant disbursement'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-indigo-600">{formatNGN(d.amount)}</span>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alumni Detail Dialog */}
      {selectedAlumni && (
        <Dialog open={!!selectedAlumni} onOpenChange={() => setSelectedAlumni(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedAlumni.organization_name || selectedAlumni.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{selectedAlumni.programme_name} · {selectedAlumni.cohort || 'No cohort'}</p>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Jobs Created', value: selectedAlumni.jobs_created || 0, color: 'text-emerald-600' },
                  { label: 'Funding Raised', value: formatNGN(selectedAlumni.funding_raised), color: 'text-indigo-600' },
                  { label: 'Post-Prog Revenue', value: formatNGN(selectedAlumni.post_programme_revenue), color: 'text-blue-600' },
                  { label: 'Funded Amount', value: formatNGN(selectedAlumni.funded_amount), color: 'text-primary' },
                ].map(s => (
                  <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                    <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              {selectedAlumni.success_story && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">Success Story</p>
                  <p className="text-sm text-gray-700 italic">"{selectedAlumni.success_story}"</p>
                </div>
              )}
              {selectedAlumni.milestones?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Milestones</p>
                  <div className="space-y-1.5">
                    {selectedAlumni.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`h-3.5 w-3.5 flex-shrink-0 ${m.status === 'completed' ? 'text-emerald-500' : 'text-gray-300'}`} />
                        <span className={m.status === 'completed' ? 'text-gray-700' : 'text-muted-foreground'}>{m.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <StatusBadge status={selectedAlumni.current_status} />
                {selectedAlumni.sector && <Badge variant="outline" className="text-xs">{selectedAlumni.sector}</Badge>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}