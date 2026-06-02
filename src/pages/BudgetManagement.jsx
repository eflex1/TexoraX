import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatsCard from '@/components/shared/StatsCard';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, PlusCircle, Pencil, Trash2, BarChart3, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DEFAULT_CATEGORIES = ['Personnel', 'Operations', 'Grants Disbursed', 'Training & Events', 'Technology', 'Marketing', 'Contingency'];

export default function BudgetManagement() {
  const queryClient = useQueryClient();
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showLineItem, setShowLineItem] = useState(false);
  const [lineItem, setLineItem] = useState({ id: '', name: '', allocated: 0, spent: 0, notes: '' });
  const [editingLine, setEditingLine] = useState(null);
  const [form, setForm] = useState({ programme_id: '', programme_name: '', fiscal_year: new Date().getFullYear().toString(), total_budget: 0, currency: 'NGN', status: 'draft', categories: [] });

  const { data: programmes = [] } = useQuery({
    queryKey: ['programmes'],
    queryFn: () => base44.entities.Programme.list('-created_date', 100),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Budget.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); setShowCreate(false); toast.success('Budget created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Budget.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Budget.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['budgets'] }); setSelectedBudget(null); toast.success('Budget deleted'); },
  });

  const totalBudgeted = budgets.reduce((s, b) => s + (b.total_budget || 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.categories || []).reduce((cs, c) => cs + (c.spent || 0), 0), 0);

  const openCreate = () => {
    setForm({ programme_id: '', programme_name: '', fiscal_year: new Date().getFullYear().toString(), total_budget: 0, currency: 'NGN', status: 'draft', categories: [] });
    setShowCreate(true);
  };

  const handleSaveLineItem = () => {
    const cats = [...(selectedBudget?.categories || [])];
    if (editingLine !== null) {
      cats[editingLine] = { ...lineItem, id: lineItem.id || Date.now().toString() };
    } else {
      cats.push({ ...lineItem, id: Date.now().toString() });
    }
    const updated = { ...selectedBudget, categories: cats };
    setSelectedBudget(updated);
    updateMutation.mutate({ id: selectedBudget.id, data: { categories: cats } });
    setShowLineItem(false);
    setLineItem({ id: '', name: '', allocated: 0, spent: 0, notes: '' });
    setEditingLine(null);
  };

  const openEditLine = (cat, idx) => {
    setLineItem({ ...cat });
    setEditingLine(idx);
    setShowLineItem(true);
  };

  const deleteLine = (idx) => {
    const cats = selectedBudget.categories.filter((_, i) => i !== idx);
    const updated = { ...selectedBudget, categories: cats };
    setSelectedBudget(updated);
    updateMutation.mutate({ id: selectedBudget.id, data: { categories: cats } });
  };

  const budget = selectedBudget ? budgets.find(b => b.id === selectedBudget.id) || selectedBudget : null;
  const allocated = (budget?.categories || []).reduce((s, c) => s + (c.allocated || 0), 0);
  const spent = (budget?.categories || []).reduce((s, c) => s + (c.spent || 0), 0);
  const remaining = (budget?.total_budget || 0) - spent;
  const spentPct = budget?.total_budget ? Math.min(100, (spent / budget.total_budget) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Management"
        description="Plan, allocate and monitor programme budgets"
        actions={
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
            <PlusCircle className="h-4 w-4 mr-2" /> New Budget
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Budgets" value={budgets.length} icon={Wallet} tooltip="Budget plans created" />
        <StatsCard title="Total Budgeted" value={`₦${(totalBudgeted / 1000000).toFixed(1)}M`} icon={BarChart3} tooltip="Sum of all budgets" />
        <StatsCard title="Total Spent" value={`₦${(totalSpent / 1000000).toFixed(1)}M`} icon={TrendingUp} tooltip="Total expenditure logged" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget list */}
        <div className="space-y-3">
          {budgets.map(b => {
            const bSpent = (b.categories || []).reduce((s, c) => s + (c.spent || 0), 0);
            const pct = b.total_budget ? Math.min(100, (bSpent / b.total_budget) * 100) : 0;
            return (
              <Card key={b.id}
                className={cn("cursor-pointer hover:shadow-md transition-all border-2", selectedBudget?.id === b.id ? 'border-primary' : 'border-transparent')}
                onClick={() => setSelectedBudget(b)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate">{b.programme_name || 'Unnamed Programme'}</p>
                      <p className="text-xs text-muted-foreground">FY {b.fiscal_year} · {b.currency || 'NGN'}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">₦{(bSpent / 1000).toFixed(0)}k spent</span>
                      <span className="font-medium">₦{((b.total_budget || 0) / 1000).toFixed(0)}k total</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {budgets.length === 0 && (
            <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No budgets yet. Create your first one.</CardContent></Card>
          )}
        </div>

        {/* Budget detail */}
        <div className="lg:col-span-2">
          {budget ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{budget.programme_name || 'Budget Detail'}</CardTitle>
                    <p className="text-sm text-muted-foreground">FY {budget.fiscal_year}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={budget.status} onValueChange={v => {
                      const updated = { ...budget, status: v };
                      setSelectedBudget(updated);
                      updateMutation.mutate({ id: budget.id, data: { status: v } });
                    }}>
                      <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMutation.mutate(budget.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: 'Total Budget', value: `₦${((budget.total_budget || 0) / 1000).toFixed(0)}k`, color: 'text-gray-900' },
                    { label: 'Spent', value: `₦${(spent / 1000).toFixed(0)}k`, color: 'text-red-600' },
                    { label: 'Remaining', value: `₦${(remaining / 1000).toFixed(0)}k`, color: remaining >= 0 ? 'text-emerald-600' : 'text-red-600' },
                  ].map(s => (
                    <div key={s.label} className="bg-muted/50 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={cn("text-lg font-bold", s.color)}>{s.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-medium">{spentPct.toFixed(1)}%</span>
                  </div>
                  <Progress value={spentPct} className={cn("h-2", spentPct > 90 ? '[&>div]:bg-red-500' : spentPct > 70 ? '[&>div]:bg-amber-500' : '')} />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Line Items</h3>
                  <Button size="sm" variant="outline" onClick={() => { setLineItem({ id: '', name: '', allocated: 0, spent: 0, notes: '' }); setEditingLine(null); setShowLineItem(true); }}>
                    <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Add Line
                  </Button>
                </div>

                {(budget.categories || []).length === 0 && (
                  <p className="text-sm text-center text-muted-foreground py-4">No line items yet</p>
                )}

                {(budget.categories || []).map((cat, idx) => {
                  const linePct = cat.allocated ? Math.min(100, ((cat.spent || 0) / cat.allocated) * 100) : 0;
                  return (
                    <div key={cat.id || idx} className="border rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{cat.name}</p>
                          {cat.notes && <p className="text-xs text-muted-foreground">{cat.notes}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">₦{(cat.spent || 0).toLocaleString()} / ₦{(cat.allocated || 0).toLocaleString()}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditLine(cat, idx)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteLine(idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Progress value={linePct} className="h-1" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                <Wallet className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-medium text-gray-700">Select a budget</p>
                <p className="text-sm text-muted-foreground">Click on a budget from the list to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Budget Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Budget Plan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Programme</Label>
              <Select value={form.programme_id} onValueChange={v => {
                const p = programmes.find(p => p.id === v);
                setForm(f => ({ ...f, programme_id: v, programme_name: p?.name || '' }));
              }}>
                <SelectTrigger><SelectValue placeholder="Select programme" /></SelectTrigger>
                <SelectContent>
                  {programmes.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fiscal Year</Label>
                <Input value={form.fiscal_year} onChange={e => setForm(f => ({ ...f, fiscal_year: e.target.value }))} placeholder="2024" />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Total Budget (₦)</Label>
              <Input type="number" value={form.total_budget} onChange={e => setForm(f => ({ ...f, total_budget: Number(e.target.value) }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.programme_id}>Create Budget</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Line Item Dialog */}
      <Dialog open={showLineItem} onOpenChange={setShowLineItem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingLine !== null ? 'Edit Line Item' : 'Add Line Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input value={lineItem.name} onChange={e => setLineItem(l => ({ ...l, name: e.target.value }))} placeholder="e.g. Personnel" list="cat-suggestions" />
              <datalist id="cat-suggestions">
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Allocated (₦)</Label>
                <Input type="number" value={lineItem.allocated} onChange={e => setLineItem(l => ({ ...l, allocated: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Spent (₦)</Label>
                <Input type="number" value={lineItem.spent} onChange={e => setLineItem(l => ({ ...l, spent: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={lineItem.notes} onChange={e => setLineItem(l => ({ ...l, notes: e.target.value }))} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLineItem(false)}>Cancel</Button>
            <Button onClick={handleSaveLineItem} disabled={!lineItem.name}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}