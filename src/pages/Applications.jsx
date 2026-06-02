import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, FileText, MoreHorizontal, Eye, CheckCircle2, XCircle, Clock, UserPlus, FolderKanban, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Applications() {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [progFilter, setProgFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [showDetail, setShowDetail] = useState(null);
  const [showAssign, setShowAssign] = useState(null);
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin';

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications'],
    queryFn: () => base44.entities.Application.list('-created_date', 500),
  });

  const { data: programmes = [] } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const { data: reviewers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
    select: data => data.filter(u => u.role === 'reviewer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Application.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['applications'] }); toast.success('Updated'); },
  });

  const filtered = applications.filter(a => {
    const matchSearch = !search ||
      a.applicant_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.applicant_email?.toLowerCase().includes(search.toLowerCase()) ||
      a.programme_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.organization_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchProg = progFilter === 'all' || a.programme_id === progFilter;
    return matchSearch && matchStatus && matchProg;
  });

  const handleBulkAction = (action) => {
    selected.forEach(id => updateMutation.mutate({ id, data: { status: action } }));
    setSelected([]);
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === filtered.length ? [] : filtered.map(a => a.id));

  const AssignReviewerDialog = ({ app, onClose }) => {
    const [picked, setPicked] = useState(app.assigned_reviewers || []);
    const toggle = (email) => setPicked(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
    const handleSave = () => {
      updateMutation.mutate({ id: app.id, data: { assigned_reviewers: picked } });
      onClose();
    };
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign Reviewers — {app.applicant_name || 'Application'}</DialogTitle></DialogHeader>
          <div className="space-y-2 py-2 max-h-72 overflow-y-auto">
            {reviewers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No reviewers found. Invite reviewers from User Management.</p>}
            {reviewers.map(r => (
              <div key={r.id} className={cn("flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all", picked.includes(r.email) ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-200')}
                onClick={() => toggle(r.email)}>
                <Checkbox checked={picked.includes(r.email)} onCheckedChange={() => toggle(r.email)} />
                <Avatar className="h-7 w-7"><AvatarFallback className="text-xs">{r.full_name?.[0] || 'R'}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{r.full_name || r.email}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </div>
                {r.coi_signed && <Badge variant="outline" className="ml-auto text-xs text-emerald-600 border-emerald-200">NCOI ✓</Badge>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave}>Save Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const DetailDialog = ({ app, onClose }) => (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              ['Applicant', app.applicant_name || '—'],
              ['Email', app.applicant_email],
              ['Organisation', app.organization_name || '—'],
              ['Programme', app.programme_name || '—'],
              ['Stage', app.current_stage?.replace(/_/g, ' ') || '—'],
              ['Sector', app.sector || '—'],
              ['Gender', app.gender || '—'],
              ['Submitted', app.submission_date ? format(new Date(app.submission_date), 'MMM d, yyyy') : '—'],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-medium">{val}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <StatusBadge status={app.status} />
          </div>
          {app.assigned_reviewers?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Assigned Reviewers</p>
              <div className="flex flex-wrap gap-1">
                {app.assigned_reviewers.map(e => <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>)}
              </div>
            </div>
          )}
          {app.documents?.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Documents</p>
              {app.documents.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline block">{d.name}</a>
              ))}
            </div>
          )}
          {isAdmin && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs text-muted-foreground">Change Status</Label>
              <div className="flex flex-wrap gap-2">
                {['submitted', 'under_review', 'shortlisted', 'approved', 'rejected', 'waitlisted'].map(s => (
                  <button key={s} onClick={() => { updateMutation.mutate({ id: app.id, data: { status: s } }); onClose(); }}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted capitalize transition-colors">
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Applications" description="Review and manage all programme applications" />

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search applicant, email, programme..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={progFilter} onValueChange={setProgFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <FolderKanban className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="All Programmes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programmes</SelectItem>
            {programmes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
          </SelectContent>
        </Select>
        {selected.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Bulk Actions ({selected.length}) <ChevronDown className="h-3 w-3 ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBulkAction('approved')}><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Approve</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('rejected')}><XCircle className="h-4 w-4 mr-2 text-red-500" /> Reject</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('waitlisted')}><Clock className="h-4 w-4 mr-2 text-amber-500" /> Waitlist</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('under_review')}><Eye className="h-4 w-4 mr-2" /> Under Review</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All', count: applications.length, status: 'all' },
          { label: 'Submitted', count: applications.filter(a => a.status === 'submitted').length, status: 'submitted' },
          { label: 'Under Review', count: applications.filter(a => a.status === 'under_review').length, status: 'under_review' },
          { label: 'Approved', count: applications.filter(a => a.status === 'approved').length, status: 'approved' },
          { label: 'Rejected', count: applications.filter(a => a.status === 'rejected').length, status: 'rejected' },
        ].map(s => (
          <button key={s.status} onClick={() => setStatusFilter(s.status)}
            className={cn("px-3 py-1 rounded-full text-xs font-medium border transition-all",
              statusFilter === s.status ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200')}>
            {s.label} · {s.count}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="animate-pulse"><CardContent className="h-64" /></Card>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="No applications found" description="Applications will appear here once applicants submit them" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={selected.length === filtered.length && filtered.length > 0} onCheckedChange={toggleAll} />
                  </TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Reviewers</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(app => (
                  <TableRow key={app.id} className="hover:bg-muted/50">
                    <TableCell><Checkbox checked={selected.includes(app.id)} onCheckedChange={() => toggleSelect(app.id)} /></TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{app.applicant_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{app.applicant_email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{app.programme_name || '—'}</TableCell>
                    <TableCell><StatusBadge status={app.status} /></TableCell>
                    <TableCell className="text-sm capitalize">{app.current_stage?.replace(/_/g, ' ') || '—'}</TableCell>
                    <TableCell>
                      {(app.assigned_reviewers || []).length > 0 ? (
                        <div className="flex -space-x-1">
                          {app.assigned_reviewers.slice(0, 3).map((e, i) => (
                            <Avatar key={i} className="h-6 w-6 border-2 border-white">
                              <AvatarFallback className="text-[9px] bg-blue-100 text-blue-700">{e[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ))}
                          {app.assigned_reviewers.length > 3 && <span className="text-xs text-muted-foreground ml-1">+{app.assigned_reviewers.length - 3}</span>}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">Unassigned</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {app.submission_date ? format(new Date(app.submission_date), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setShowDetail(app)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                          {isAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => setShowAssign(app)}><UserPlus className="h-4 w-4 mr-2" /> Assign Reviewers</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: app.id, data: { status: 'approved' } })}><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Approve</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: app.id, data: { status: 'rejected' } })}><XCircle className="h-4 w-4 mr-2 text-red-500" /> Reject</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateMutation.mutate({ id: app.id, data: { status: 'shortlisted' } })}><CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500" /> Shortlist</DropdownMenuItem>
                            </>
                          )}
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

      {showDetail && <DetailDialog app={showDetail} onClose={() => setShowDetail(null)} />}
      {showAssign && <AssignReviewerDialog app={showAssign} onClose={() => setShowAssign(null)} />}
    </div>
  );
}