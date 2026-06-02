import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { GraduationCap, Users, DollarSign, Briefcase, Search, PlusCircle, MoreHorizontal, Pencil, Trash2, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['hsl(222,47%,19%)', 'hsl(36,90%,55%)', 'hsl(160,100%,33%)', 'hsl(270,50%,55%)', 'hsl(200,80%,55%)', 'hsl(0,80%,55%)', 'hsl(300,50%,55%)'];

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-amber-50 text-amber-700',
  exited: 'bg-gray-100 text-gray-500',
};

const blankForm = {
  name: '', email: '', organization_name: '', programme_id: '', programme_name: '',
  cohort: '', graduation_date: '', funded_amount: 0, current_status: 'active',
  post_programme_revenue: 0, jobs_created: 0, funding_raised: 0,
  sector: '', gender: '', location: '', age: 0,
  mentor_name: '', success_story: '',
};

function countBy(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key] || 'Unknown';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function toChartData(obj) {
  return Object.entries(obj).map(([name, value]) => ({ name, value }));
}

export default function Alumni() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editAlumni, setEditAlumni] = useState(null);
  const [form, setForm] = useState(blankForm);

  const { data: alumni = [] } = useQuery({
    queryKey: ['alumni'],
    queryFn: () => base44.entities.Alumni.list('-created_date', 500),
  });

  const { data: programmes = [] } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const { data: disbursements = [] } = useQuery({
    queryKey: ['disbursements'],
    queryFn: () => base44.entities.Disbursement.list('-created_date', 500),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Alumni.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alumni'] }); setShowCreate(false); toast.success('Alumni added'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Alumni.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alumni'] }); setEditAlumni(null); toast.success('Alumni updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Alumni.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alumni'] }); toast.success('Alumni removed'); },
  });

  const cohorts = [...new Set(alumni.map(a => a.cohort).filter(Boolean))].sort();

  const filtered = alumni.filter(a => {
    const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.organization_name?.toLowerCase().includes(search.toLowerCase());
    const matchProg = programmeFilter === 'all' || a.programme_id === programmeFilter;
    const matchCohort = cohortFilter === 'all' || a.cohort === cohortFilter;
    const matchStatus = statusFilter === 'all' || a.current_status === statusFilter;
    return matchSearch && matchProg && matchCohort && matchStatus;
  });

  const totalFunding = alumni.reduce((s, a) => s + (a.funding_raised || 0), 0);
  const totalJobs = alumni.reduce((s, a) => s + (a.jobs_created || 0), 0);

  // Analytics data
  const genderData = toChartData(countBy(alumni, 'gender'));
  const sectorData = toChartData(countBy(alumni, 'sector'));
  const locationData = toChartData(countBy(alumni, 'location'));
  const statusData = toChartData(countBy(alumni, 'current_status'));

  // Per-programme stats
  const perProgramme = programmes.map(p => {
    const pAlumni = alumni.filter(a => a.programme_id === p.id);
    const pDisb = disbursements.filter(d => d.programme_id === p.id && d.status === 'completed');
    return {
      name: p.name?.length > 20 ? p.name.slice(0, 19) + '…' : p.name,
      alumni: pAlumni.length,
      jobs: pAlumni.reduce((s, a) => s + (a.jobs_created || 0), 0),
      disbursed: pDisb.reduce((s, d) => s + (d.amount || 0), 0),
    };
  }).filter(p => p.alumni > 0 || p.disbursed > 0);

  // Age distribution (if age field populated)
  const ageGroups = alumni.reduce((acc, a) => {
    if (!a.age) return acc;
    const bucket = a.age < 25 ? 'Under 25' : a.age < 35 ? '25–34' : a.age < 45 ? '35–44' : '45+';
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {});
  const ageData = toChartData(ageGroups);

  const openCreate = () => { setForm(blankForm); setShowCreate(true); };
  const openEdit = (a) => { setEditAlumni(a); setForm({ ...a }); };

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Email *</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Organization</Label><Input value={form.organization_name} onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Sector</Label><Input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Age</Label><Input type="number" value={form.age || ''} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} /></div>
        <div className="space-y-2"><Label>Location</Label><Input value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Programme</Label>
          <Select value={form.programme_id} onValueChange={v => {
            const p = programmes.find(p => p.id === v);
            setForm(f => ({ ...f, programme_id: v, programme_name: p?.name || '' }));
          }}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{programmes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2"><Label>Cohort</Label><Input value={form.cohort} onChange={e => setForm(f => ({ ...f, cohort: e.target.value }))} placeholder="e.g. Cohort 1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Graduation Date</Label><Input type="date" value={form.graduation_date} onChange={e => setForm(f => ({ ...f, graduation_date: e.target.value }))} /></div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.current_status} onValueChange={v => setForm(f => ({ ...f, current_status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="exited">Exited</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Funded (₦)</Label><Input type="number" value={form.funded_amount} onChange={e => setForm(f => ({ ...f, funded_amount: Number(e.target.value) }))} /></div>
        <div className="space-y-2"><Label>Funding Raised ($)</Label><Input type="number" value={form.funding_raised} onChange={e => setForm(f => ({ ...f, funding_raised: Number(e.target.value) }))} /></div>
        <div className="space-y-2"><Label>Jobs Created</Label><Input type="number" value={form.jobs_created} onChange={e => setForm(f => ({ ...f, jobs_created: Number(e.target.value) }))} /></div>
      </div>
      <div className="space-y-2"><Label>Success Story</Label><Input value={form.success_story} onChange={e => setForm(f => ({ ...f, success_story: e.target.value }))} placeholder="Brief impact story..." /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumni Tracker"
        description="Track post-programme outcomes, cohorts, and impact"
        actions={
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Alumni
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Alumni" value={alumni.length} icon={GraduationCap} tooltip="Total programme graduates" />
        <StatsCard title="Active" value={alumni.filter(a => a.current_status === 'active').length} icon={Users} tooltip="Currently active alumni" />
        <StatsCard title="Funding Raised" value={`$${(totalFunding / 1000).toFixed(0)}k`} icon={DollarSign} tooltip="Total post-programme funding raised" />
        <StatsCard title="Jobs Created" value={totalJobs} icon={Briefcase} tooltip="Total jobs created by alumni" />
      </div>

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search alumni..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={programmeFilter} onValueChange={setProgrammeFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="All Programmes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programmes</SelectItem>
                {programmes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cohortFilter} onValueChange={setCohortFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Cohorts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                {cohorts.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No alumni records" description="Add alumni manually or move applicants from completed programmes" />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Programme</TableHead>
                      <TableHead>Cohort</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Funded</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Funding Raised</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.organization_name || a.email}</p>
                        </TableCell>
                        <TableCell className="text-sm">{a.programme_name || '—'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{a.cohort || '—'}</Badge></TableCell>
                        <TableCell className="text-sm capitalize">{a.gender || '—'}</TableCell>
                        <TableCell className="text-sm">{a.location || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[a.current_status] || ''}>{a.current_status || 'active'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">₦{(a.funded_amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm font-medium">{a.jobs_created || 0}</TableCell>
                        <TableCell className="text-sm font-medium">${(a.funding_raised || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(a)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteMutation.mutate(a.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 mt-4">
          {/* Per-programme grants analytics */}
          {perProgramme.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Alumni & Grants per Programme</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perProgramme} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="alumni" name="Alumni" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="jobs" name="Jobs Created" fill={COLORS[2]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gender */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Gender Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  {genderData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No gender data yet</div>}
                </div>
              </CardContent>
            </Card>

            {/* Age distribution */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Age Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  {ageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" name="Alumni" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No age data yet — add ages to alumni profiles</div>}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Location Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  {locationData.filter(d => d.name !== 'Unknown').length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={locationData.filter(d => d.name !== 'Unknown')} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="value" name="Alumni" fill={COLORS[3]} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No location data yet</div>}
                </div>
              </CardContent>
            </Card>

            {/* Sector */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Sector Distribution</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  {sectorData.filter(d => d.name !== 'Unknown').length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sectorData.filter(d => d.name !== 'Unknown')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                          {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={10} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No sector data yet</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Per-programme disbursement table */}
          {perProgramme.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Grants per Programme</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Programme</TableHead>
                      <TableHead className="text-right">Alumni</TableHead>
                      <TableHead className="text-right">Jobs Created</TableHead>
                      <TableHead className="text-right">Disbursed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perProgramme.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="text-right text-sm">{p.alumni}</TableCell>
                        <TableCell className="text-right text-sm">{p.jobs}</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-emerald-600">₦{(p.disbursed / 1000).toFixed(0)}k</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Alumni</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.email}>Add Alumni</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAlumni} onOpenChange={() => setEditAlumni(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Alumni</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditAlumni(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: editAlumni.id, data: form })}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}