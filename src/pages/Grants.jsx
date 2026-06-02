import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Wallet, TrendingUp, Clock, CheckCircle2, PlusCircle, MoreHorizontal, Pencil, Download, FileText, Eye, MessageSquarePlus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MILESTONES = [
  'Initial Disbursement', 'Q1 Milestone', 'Q2 Milestone', 'Q3 Milestone', 'Q4 Milestone',
  'Proof of Concept', 'Prototype Delivery', 'Market Launch', 'Final Disbursement', 'Custom',
];

const blankDisb = {
  programme_id: '', recipient_name: '', recipient_email: '', amount: 0,
  currency: 'NGN', status: 'scheduled', scheduled_date: '',
  milestone_id: '', milestone_name: '', notes: '', documentation_url: '',
};

export default function Grants() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [showCreate, setShowCreate] = useState(false);
  const [editDisb, setEditDisb] = useState(null);
  const [viewDisb, setViewDisb] = useState(null);
  const [noteDisb, setNoteDisb] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [form, setForm] = useState(blankDisb);
  const [progFilter, setProgFilter] = useState('all');
  const [customMilestone, setCustomMilestone] = useState('');

  const { data: disbursements = [] } = useQuery({
    queryKey: ['disbursements'],
    queryFn: () => base44.entities.Disbursement.list('-created_date', 500),
  });

  const { data: programmes = [] } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Disbursement.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['disbursements'] }); setShowCreate(false); toast.success('Disbursement added'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Disbursement.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['disbursements'] }); setEditDisb(null); setNoteDisb(null); toast.success('Updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Disbursement.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['disbursements'] }); toast.success('Deleted'); },
  });

  const filtered = progFilter === 'all' ? disbursements : disbursements.filter(d => d.programme_id === progFilter);

  const totalAmount = filtered.reduce((s, d) => s + (d.amount || 0), 0);
  const completed = filtered.filter(d => d.status === 'completed');
  const completedAmount = completed.reduce((s, d) => s + (d.amount || 0), 0);
  const remaining = totalAmount - completedAmount;
  const pending = filtered.filter(d => d.status === 'pending' || d.status === 'scheduled');

  const openCreate = () => { setForm(blankDisb); setCustomMilestone(''); setShowCreate(true); };
  const openEdit = (d) => { setEditDisb(d); setForm({ ...d }); setCustomMilestone(''); };

  const getMilestoneName = () => form.milestone_name === 'Custom' ? customMilestone : form.milestone_name;

  const exportCSV = () => {
    const rows = [
      ['Recipient', 'Email', 'Amount', 'Currency', 'Status', 'Milestone', 'Scheduled', 'Completed', 'Notes'],
      ...filtered.map(d => [d.recipient_name, d.recipient_email, d.amount, d.currency, d.status, d.milestone_name, d.scheduled_date, d.completed_date, d.notes]),
    ];
    const csv = rows.map(r => r.map(c => `"${c || ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'disbursements.csv'; a.click();
    toast.success('Exported');
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const existing = noteDisb.notes || '';
    const updated = existing
      ? `${existing}\n\n[${format(new Date(), 'MMM d, yyyy HH:mm')} - ${user?.full_name || user?.email}]: ${noteText}`
      : `[${format(new Date(), 'MMM d, yyyy HH:mm')} - ${user?.full_name || user?.email}]: ${noteText}`;
    updateMutation.mutate({ id: noteDisb.id, data: { notes: updated } });
    setNoteText('');
    setNoteDisb(null);
  };

  const FormFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Recipient Name</Label><Input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Recipient Email</Label><Input value={form.recipient_email} onChange={e => setForm(f => ({ ...f, recipient_email: e.target.value }))} /></div>
      </div>
      <div className="space-y-2">
        <Label>Programme</Label>
        <Select value={form.programme_id} onValueChange={v => setForm(f => ({ ...f, programme_id: v }))}>
          <SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger>
          <SelectContent>{programmes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} /></div>
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NGN">NGN</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Scheduled Date</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} /></div>
        <div className="space-y-2">
          <Label>Milestone</Label>
          <Select value={form.milestone_name} onValueChange={v => setForm(f => ({ ...f, milestone_name: v }))}>
            <SelectTrigger><SelectValue placeholder="Select milestone" /></SelectTrigger>
            <SelectContent>
              {MILESTONES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {form.milestone_name === 'Custom' && (
        <div className="space-y-2">
          <Label>Custom Milestone Name</Label>
          <Input value={customMilestone} onChange={e => setCustomMilestone(e.target.value)} placeholder="Enter milestone name" />
        </div>
      )}
      <div className="space-y-2">
        <Label>Notes / M&E Progress</Label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Fund usage notes, progress..." className="h-20" />
      </div>
      <div className="space-y-2">
        <Label>Documentation URL</Label>
        <Input value={form.documentation_url} onChange={e => setForm(f => ({ ...f, documentation_url: e.target.value }))} placeholder="https://..." />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grant Disbursement Management"
        description="Track disbursements, fund utilization, and progress notes"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            {isAdmin && (
              <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Disbursement
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Allocated" value={`₦${(totalAmount / 1000).toFixed(0)}k`} icon={Wallet} tooltip="Total grant allocation" />
        <StatsCard title="Disbursed" value={`₦${(completedAmount / 1000).toFixed(0)}k`} icon={TrendingUp} tooltip="Amount already disbursed"
          subtitle={totalAmount > 0 ? `${((completedAmount / totalAmount) * 100).toFixed(1)}% utilized` : ''} />
        <StatsCard title="Remaining" value={`₦${(remaining / 1000).toFixed(0)}k`} icon={CheckCircle2} tooltip="Balance remaining" />
        <StatsCard title="Pending" value={pending.length} icon={Clock} tooltip="Disbursements awaiting completion" />
      </div>

      <div className="flex gap-3">
        <Select value={progFilter} onValueChange={setProgFilter}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Programmes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programmes</SelectItem>
            {programmes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Disbursement Records</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(d => (
                <TableRow key={d.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{d.recipient_name || '—'}</p>
                    <p className="text-xs text-muted-foreground">{d.recipient_email}</p>
                  </TableCell>
                  <TableCell className="text-sm font-semibold">{d.currency || 'NGN'} {(d.amount || 0).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={d.status} /></TableCell>
                  <TableCell className="text-sm">{d.milestone_name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {d.scheduled_date ? format(new Date(d.scheduled_date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{d.notes || '—'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewDisb(d)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuItem onClick={() => { setNoteDisb(d); setNoteText(''); }}>
                              <MessageSquarePlus className="h-4 w-4 mr-2" /> Add Progress Note
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(d)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateMutation.mutate({ id: d.id, data: { status: 'completed', completed_date: new Date().toISOString().slice(0, 10) } })}>
                              <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteMutation.mutate(d.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No disbursements recorded</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Details Dialog (all users) */}
      <Dialog open={!!viewDisb} onOpenChange={() => setViewDisb(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Disbursement Details</DialogTitle></DialogHeader>
          {viewDisb && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Recipient', value: viewDisb.recipient_name || '—' },
                  { label: 'Email', value: viewDisb.recipient_email || '—' },
                  { label: 'Amount', value: `${viewDisb.currency || 'NGN'} ${(viewDisb.amount || 0).toLocaleString()}` },
                  { label: 'Status', value: <StatusBadge status={viewDisb.status} /> },
                  { label: 'Milestone', value: viewDisb.milestone_name || '—' },
                  { label: 'Scheduled Date', value: viewDisb.scheduled_date ? format(new Date(viewDisb.scheduled_date), 'MMM d, yyyy') : '—' },
                  { label: 'Completed Date', value: viewDisb.completed_date ? format(new Date(viewDisb.completed_date), 'MMM d, yyyy') : '—' },
                  { label: 'Programme', value: programmes.find(p => p.id === viewDisb.programme_id)?.name || viewDisb.programme_id || '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <div className="text-sm font-medium mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              {viewDisb.documentation_url && (
                <div>
                  <p className="text-xs text-muted-foreground">Documentation</p>
                  <a href={viewDisb.documentation_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">{viewDisb.documentation_url}</a>
                </div>
              )}
              {viewDisb.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Progress Notes / M&E</p>
                  <div className="bg-muted/50 rounded-xl p-3 text-sm whitespace-pre-wrap leading-relaxed">{viewDisb.notes}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDisb(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Progress Note Dialog */}
      <Dialog open={!!noteDisb} onOpenChange={() => setNoteDisb(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Progress Note</DialogTitle></DialogHeader>
          {noteDisb && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">Adding note for <strong>{noteDisb.recipient_name}</strong> — {noteDisb.milestone_name || 'disbursement'}</p>
              {noteDisb.notes && (
                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {noteDisb.notes}
                </div>
              )}
              <div className="space-y-2">
                <Label>New Note</Label>
                <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter progress update, M&E notes..." className="h-24" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDisb(null)}>Cancel</Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim()}>Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Disbursement</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, milestone_name: getMilestoneName() })}>Add Disbursement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDisb} onOpenChange={() => setEditDisb(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Disbursement</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDisb(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: editDisb.id, data: { ...form, milestone_name: getMilestoneName() } })}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}