import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatsCard from '@/components/shared/StatsCard';
import { Check, Zap, Rocket, Building2, Gift, Users, CreditCard, TrendingUp, Banknote, Smartphone } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// NGN pricing
const CYCLE_DISCOUNTS = { monthly: 0, quarterly: 0.08, annual: 0.20 };

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Gift,
    base_monthly: 0,
    color: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-100', iconColor: 'text-gray-600',
    badgeColor: 'bg-gray-100 text-gray-700',
    description: 'Get started at no cost.',
    features: [
      '3 Programmes', '500 Applications (total)', '2 Reviewers',
      'Basic Analytics', 'Email Support',
    ],
    limits: { programmes: 3, applications: 500, reviewers: 2 },
    blindReview: false, integrations: [],
  },
  {
    id: 'starter',
    name: 'Starter',
    icon: Zap,
    base_monthly: 50000,
    color: 'bg-violet-50 border-violet-200',
    iconBg: 'bg-violet-100', iconColor: 'text-violet-600',
    badgeColor: 'bg-violet-100 text-violet-700',
    description: 'For small teams running their first programmes.',
    features: [
      '10 Programmes (+₦5,000/extra)', '1,500 Applications per programme', '4 Reviewers',
      'Basic Analytics', 'Email Support', 'Blind Review ✅',
    ],
    limits: { programmes: 10, applications: 1500, reviewers: 4 },
    addon_programme: 5000,
    blindReview: true, integrations: [],
  },
  {
    id: 'growth',
    name: 'Growth',
    icon: Rocket,
    base_monthly: 150000,
    color: 'bg-indigo-50 border-indigo-200',
    iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    popular: true,
    description: 'For organisations scaling their impact.',
    features: [
      '20 Programmes (+₦5,000/extra)', 'Unlimited Applications', '7 Reviewers (+₦2,000/seat)',
      'Advanced Analytics + Calibration', 'Priority Support', 'Blind Review ✅', 'Google Calendar',
    ],
    limits: { programmes: 20, applications: null, reviewers: 7 },
    addon_programme: 5000, addon_reviewer: 2000,
    blindReview: true, integrations: ['Google Calendar'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    base_monthly: null,
    color: 'bg-fuchsia-50 border-fuchsia-200',
    iconBg: 'bg-fuchsia-100', iconColor: 'text-fuchsia-600',
    badgeColor: 'bg-fuchsia-100 text-fuchsia-700',
    description: 'Custom pricing for large-scale operations.',
    features: [
      'Unlimited Programmes', 'Unlimited Applications', 'Unlimited Reviewers',
      'Advanced Analytics + Custom Reporting', 'Dedicated Support', 'Blind Review ✅',
      'Google, Zoom, MS Teams + White-labeling',
    ],
    limits: { programmes: null, applications: null, reviewers: null },
    blindReview: true, integrations: ['Google Calendar', 'Google Workspace', 'Zoom', 'Microsoft Teams', 'White-labeling'],
  },
];

function formatNGN(n) {
  if (n === null) return 'Custom';
  return `₦${n.toLocaleString()}`;
}

function calcPrice(plan, cycle) {
  if (plan.base_monthly === null) return null;
  const discount = CYCLE_DISCOUNTS[cycle] || 0;
  return Math.round(plan.base_monthly * (1 - discount));
}

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700',
  trialing: 'bg-sky-100 text-sky-700',
  past_due: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-600',
  paused: 'bg-gray-100 text-gray-600',
};

export default function Pricing() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [cycle, setCycle] = useState('monthly');
  const [showAdd, setShowAdd] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [showPayment, setShowPayment] = useState(null); // plan object
  const [payMethod, setPayMethod] = useState('card');
  const [form, setForm] = useState({ user_email: '', user_name: '', plan: 'starter', billing_cycle: 'monthly', status: 'active', amount: 50000 });

  const isAdmin = user?.role === 'admin';

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 200),
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Subscription.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); setShowAdd(false); toast.success('Subscription created'); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Subscription.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscriptions'] }); setEditSub(null); toast.success('Subscription updated'); },
  });

  const activeCount = subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const mrr = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => {
    const a = s.billing_cycle === 'annual' ? (s.amount || 0) / 12 : (s.amount || 0);
    return sum + a;
  }, 0);

  const openEdit = (sub) => { setEditSub(sub); setForm({ ...sub }); };
  const openAdd = () => {
    setForm({ user_email: '', user_name: '', plan: 'starter', billing_cycle: 'monthly', status: 'active', amount: 50000, start_date: new Date().toISOString().slice(0, 10) });
    setShowAdd(true);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Simple, transparent pricing</h2>
        <p className="text-gray-500 text-base">All prices in Nigerian Naira (NGN). Discounts apply on longer cycles.</p>
        {/* Cycle switcher */}
        <div className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1 mt-2">
          {[
            { key: 'monthly', label: 'Monthly' },
            { key: 'quarterly', label: 'Quarterly', badge: '-8%' },
            { key: 'annual', label: 'Annual', badge: '-20%' },
          ].map(c => (
            <button key={c.key} onClick={() => setCycle(c.key)}
              className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                cycle === c.key ? 'bg-white shadow text-gray-900' : 'text-gray-500')}>
              {c.label}
              {c.badge && <span className="text-violet-600 text-xs font-semibold">{c.badge}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {PLANS.map(plan => {
          const Icon = plan.icon;
          const price = calcPrice(plan, cycle);
          return (
            <div key={plan.id}
              className={cn("relative rounded-2xl border-2 p-6 flex flex-col gap-4 transition-shadow hover:shadow-lg", plan.color,
                plan.popular && "ring-2 ring-indigo-400")}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-indigo-600 text-white text-xs px-3 py-0.5 rounded-full shadow">Most Popular</Badge>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className={cn("p-2.5 rounded-xl", plan.iconBg)}>
                  <Icon className={cn("h-5 w-5", plan.iconColor)} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.description}</p>
                </div>
              </div>

              <div className="flex items-end gap-1">
                <span className="text-3xl font-extrabold text-gray-900">{price !== null ? formatNGN(price) : 'Custom'}</span>
                {price !== null && <span className="text-gray-400 text-sm mb-1">/mo</span>}
              </div>

              {cycle !== 'monthly' && price !== null && plan.base_monthly > 0 && (
                <p className="text-xs text-emerald-600 font-medium -mt-3">
                  Save {formatNGN(Math.round((plan.base_monthly - price) * (cycle === 'quarterly' ? 3 : 12)))} / {cycle === 'quarterly' ? 'quarter' : 'year'}
                </p>
              )}

              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>

              {plan.addon_programme && (
                <p className="text-xs text-gray-500 border-t pt-2">Add-ons: +₦{plan.addon_programme.toLocaleString()} per extra programme{plan.addon_reviewer ? `, +₦${plan.addon_reviewer.toLocaleString()} per extra reviewer seat` : ''}</p>
              )}

              <button
                onClick={() => plan.id !== 'free' && setShowPayment(plan)}
                className={cn("w-full py-2.5 rounded-xl font-semibold text-sm transition-all",
                  plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' :
                  plan.id === 'enterprise' ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700' :
                  plan.id === 'free' ? 'bg-gray-200 text-gray-600 cursor-default' :
                  'bg-white text-gray-800 border border-gray-200 hover:bg-gray-50')}>
                {plan.id === 'free' ? 'Current Free Tier' : plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={!!showPayment} onOpenChange={() => setShowPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to {showPayment?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{showPayment?.name} · {cycle}</span>
                <span className="font-bold">{showPayment ? formatNGN(calcPrice(showPayment, cycle)) : ''}/mo</span>
              </div>
              {cycle !== 'monthly' && (
                <p className="text-xs text-emerald-600 mt-1">{cycle === 'quarterly' ? '8%' : '20%'} cycle discount applied</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setPayMethod('card')}
                  className={cn("flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-all",
                    payMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200')}>
                  <CreditCard className="h-4 w-4" /> Card
                </button>
                <button onClick={() => setPayMethod('paystack')}
                  className={cn("flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-all",
                    payMethod === 'paystack' ? 'border-primary bg-primary/5' : 'border-gray-200')}>
                  <Smartphone className="h-4 w-4" /> Paystack Titan
                </button>
                <button onClick={() => setPayMethod('bank')}
                  className={cn("flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-all",
                    payMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-gray-200')}>
                  <Banknote className="h-4 w-4" /> Bank Transfer
                </button>
              </div>
            </div>
            {payMethod === 'paystack' && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm space-y-2">
                <p className="font-semibold text-violet-800">Paystack Titan</p>
                <p className="text-violet-700">You will be redirected to a secure Paystack Titan checkout to complete your payment.</p>
                <p className="text-violet-600 text-xs">Supports card, bank transfer, USSD, and mobile money via Paystack.</p>
              </div>
            )}
            {payMethod === 'card' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Card Number</Label>
                  <Input placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Expiry</Label><Input placeholder="MM/YY" /></div>
                  <div className="space-y-2"><Label>CVV</Label><Input placeholder="•••" /></div>
                </div>
              </div>
            )}
            {payMethod === 'bank' && (
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
                  <p className="font-semibold text-blue-800">🇺🇸 Wells Fargo (USD Wire)</p>
                  <p className="text-blue-700">Account Name: Khadasha Innovations Africa</p>
                  <p className="text-blue-700">Account Number: 40630221882687184</p>
                  <p className="text-blue-700">Account Type: Checking</p>
                  <p className="text-blue-700">Routing Number: 121000248</p>
                  <p className="text-blue-700">SWIFT: WFBIUS6SXXX</p>
                  <p className="text-blue-600 text-xs">651 N Broad St, Suite 206, Middletown, 19709 Delaware, US</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm space-y-1">
                  <p className="font-semibold text-emerald-800">🇳🇬 Providus Bank (NGN Transfer)</p>
                  <p className="text-emerald-700">Account Name: Khadasha Innovations Africa</p>
                  <p className="text-emerald-700">Account Number: 4208838074</p>
                </div>
                <p className="text-xs text-muted-foreground">Use your email as transfer reference. Manual reconciliation may take 24–48 hours.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(null)}>Cancel</Button>
            <Button onClick={() => { toast.success('Your subscription request has been received. We will confirm within 24 hours.'); setShowPayment(null); }}>
              {payMethod === 'bank' ? 'I Have Transferred' : 'Pay Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Management — Admin only */}
      {isAdmin && (
        <div className="space-y-6 border-t pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Subscription Management</h2>
              <p className="text-sm text-gray-500">Track and manage customer subscriptions</p>
            </div>
            <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
              <CreditCard className="h-4 w-4 mr-2" /> Add Subscription
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard title="Active Subscriptions" value={activeCount} icon={Users} tooltip="Currently active or trialing" />
            <StatsCard title="Monthly Recurring Revenue" value={`₦${mrr.toLocaleString()}`} icon={TrendingUp} tooltip="Estimated MRR" />
            <StatsCard title="Total Customers" value={subscriptions.length} icon={CreditCard} tooltip="All subscriptions ever created" />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Customer</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Amount (₦)</TableHead>
                    <TableHead>Renewal</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map(sub => {
                    const plan = PLANS.find(p => p.id === sub.plan);
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <p className="text-sm font-medium">{sub.user_name || sub.user_email}</p>
                          <p className="text-xs text-gray-400">{sub.user_email}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={plan?.badgeColor || 'bg-gray-100'}>{sub.plan}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", statusColors[sub.status] || 'bg-gray-100')}>{sub.status}</span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 capitalize">{sub.billing_cycle}</TableCell>
                        <TableCell className="text-sm font-semibold">₦{(sub.amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {sub.renewal_date ? format(new Date(sub.renewal_date), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(sub)} className="text-primary">Edit</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {subscriptions.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-gray-400">No subscriptions yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showAdd || !!editSub} onOpenChange={() => { setShowAdd(false); setEditSub(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editSub ? 'Edit Subscription' : 'Add Subscription'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input value={form.user_email} onChange={e => setForm(p => ({ ...p, user_email: e.target.value }))} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input value={form.user_name} onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))} placeholder="Full Name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={form.plan} onValueChange={v => {
                  const plan = PLANS.find(p => p.id === v);
                  setForm(p => ({ ...p, plan: v, amount: plan?.base_monthly || 0 }));
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={form.billing_cycle} onValueChange={v => setForm(p => ({ ...p, billing_cycle: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly (–8%)</SelectItem>
                    <SelectItem value="annual">Annual (–20%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date || ''} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Renewal Date</Label>
                <Input type="date" value={form.renewal_date || ''} onChange={e => setForm(p => ({ ...p, renewal_date: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditSub(null); }}>Cancel</Button>
            <Button onClick={() => {
              if (editSub) updateMutation.mutate({ id: editSub.id, data: form });
              else createMutation.mutate(form);
            }}>
              {editSub ? 'Save Changes' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}