import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, UserPlus, CheckCircle2, XCircle, MoreHorizontal, Pencil, Trash2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const roleColors = {
  admin: 'bg-primary/10 text-primary',
  reviewer: 'bg-blue-50 text-blue-700',
  donor: 'bg-amber-50 text-amber-700',
  applicant: 'bg-emerald-50 text-emerald-700',
};

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showInvite, setShowInvite] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('applicant');
  const [editForm, setEditForm] = useState({ role: '', organization: '', phone: '' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  const { data: programmes = [] } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setShowEdit(false); toast.success('User updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.User.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); },
  });

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleInvite = async () => {
    await base44.users.inviteUser(inviteEmail, inviteRole === 'admin' ? 'admin' : 'user');
    toast.success(`Invitation sent to ${inviteEmail} as ${inviteRole}`);
    setShowInvite(false);
    setInviteEmail('');
    setInviteRole('applicant');
  };

  const openEdit = (u) => {
    setEditUser(u);
    setEditForm({ role: u.role || 'applicant', organization: u.organization || '', phone: u.phone || '' });
    setShowEdit(true);
  };

  const handleDelete = (u) => {
    if (confirm(`Delete user ${u.full_name || u.email}? This cannot be undone.`)) {
      deleteMutation.mutate(u.id);
    }
  };

  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage all platform users, roles, and permissions"
        actions={
          <Button onClick={() => setShowInvite(true)} className="bg-primary hover:bg-primary/90">
            <UserPlus className="h-4 w-4 mr-2" /> Invite User
          </Button>
        }
      />

      {/* Role summary */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All', count: users.length },
          { key: 'admin', label: 'Admins', count: roleCounts.admin || 0 },
          { key: 'reviewer', label: 'Reviewers', count: roleCounts.reviewer || 0 },
          { key: 'donor', label: 'Donors', count: roleCounts.donor || 0 },
          { key: 'applicant', label: 'Applicants', count: roleCounts.applicant || 0 },
        ].map(r => (
          <button key={r.key} onClick={() => setRoleFilter(r.key)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
              roleFilter === r.key ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50')}>
            {r.label}
            <span className={cn("text-xs rounded-full px-1.5", roleFilter === r.key ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground')}>
              {r.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>COI Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        {u.avatar_url && <AvatarImage src={u.avatar_url} alt={u.full_name} />}
                        <AvatarFallback className="text-xs bg-muted">
                          {u.full_name ? u.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.full_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleColors[u.role] || 'bg-gray-100 text-gray-600'}>
                      {u.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{u.organization || '—'}</TableCell>
                  <TableCell>
                    {u.role === 'reviewer' ? (
                      u.coi_signed ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Signed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Unsigned
                        </div>
                      )
                    ) : <span className="text-xs text-muted-foreground">N/A</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.created_date ? format(new Date(u.created_date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(u)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="user@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {['admin', 'reviewer', 'donor', 'applicant'].map(r => (
                  <button key={r} onClick={() => setInviteRole(r)}
                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium capitalize transition-all",
                      inviteRole === r ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-600')}>
                    <span className={cn("w-2 h-2 rounded-full", inviteRole === r ? 'bg-primary' : 'bg-gray-300')} />
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail}>Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User — {editUser?.full_name || editUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email (immutable)</Label>
              <Input value={editUser?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="reviewer">Reviewer</SelectItem>
                  <SelectItem value="donor">Donor</SelectItem>
                  <SelectItem value="applicant">Applicant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input value={editForm.organization} onChange={e => setEditForm(f => ({ ...f, organization: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate({ id: editUser.id, data: editForm })}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}