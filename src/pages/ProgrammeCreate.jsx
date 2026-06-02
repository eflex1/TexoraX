import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Save, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STEPS = ['Basic Info', 'Dates & Budget', 'Application Form', 'Review Config', 'Preview & Publish'];

export default function ProgrammeCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', description: '', category: 'accelerator', objectives: '', status: 'draft',
    start_date: '', end_date: '', application_deadline: '', total_budget: 0, max_participants: 0,
    eligibility_criteria: [''],
    form_fields: [],
    review_stages: [
      { name: 'Screening', min_score: 60, blind_review: false },
      { name: 'Panel Review', min_score: 70, blind_review: false },
    ],
    blind_review_enabled: false, sdg_alignments: [], documents: [],
  });

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const createMutation = useMutation({
    mutationFn: (programmeData) => base44.entities.Programme.create(programmeData),
    onSuccess: () => {
      toast.success('Programme created successfully');
      navigate('/programmes');
    },
  });

  const handleSaveDraft = () => {
    createMutation.mutate({ ...data, status: 'draft' });
  };

  const handlePublish = () => {
    createMutation.mutate({ ...data, status: 'application' });
  };

  const addCriteria = () => update('eligibility_criteria', [...data.eligibility_criteria, '']);
  const updateCriteria = (i, v) => {
    const copy = [...data.eligibility_criteria];
    copy[i] = v;
    update('eligibility_criteria', copy);
  };
  const removeCriteria = (i) => update('eligibility_criteria', data.eligibility_criteria.filter((_, idx) => idx !== i));

  const addFormField = () => {
    update('form_fields', [...data.form_fields, {
      id: `field_${Date.now()}`, type: 'text', label: '', required: false, placeholder: '', section: 'General', order: data.form_fields.length
    }]);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Create Programme" description={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`} />

      <div className="flex items-center gap-2 mb-2">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => setStep(i)}
            className={cn("text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
              i === step ? "bg-primary text-primary-foreground" :
              i < step ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
            )}>{s}</button>
        ))}
      </div>
      <Progress value={((step + 1) / STEPS.length) * 100} className="h-1" />

      <Card>
        <CardContent className="pt-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Programme Name *</Label>
                <Input value={data.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Africa Innovation Accelerator 2025" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={data.category} onValueChange={v => update('category', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['accelerator', 'incubator', 'grant', 'fellowship', 'bootcamp', 'other'].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={data.description} onChange={e => update('description', e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Objectives</Label>
                <Textarea value={data.objectives} onChange={e => update('objectives', e.target.value)} rows={3} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={data.start_date} onChange={e => update('start_date', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={data.end_date} onChange={e => update('end_date', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Application Deadline</Label>
                <Input type="date" value={data.application_deadline} onChange={e => update('application_deadline', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Budget ($)</Label>
                  <Input type="number" value={data.total_budget} onChange={e => update('total_budget', Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Participants</Label>
                  <Input type="number" value={data.max_participants} onChange={e => update('max_participants', Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Eligibility Criteria</Label>
                {data.eligibility_criteria.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={c} onChange={e => updateCriteria(i, e.target.value)} placeholder={`Criterion ${i + 1}`} />
                    <Button variant="ghost" size="sm" onClick={() => removeCriteria(i)}>×</Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addCriteria}>+ Add Criterion</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Define the fields applicants will fill out.</p>
              {data.form_fields.map((field, i) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Label</Label>
                      <Input value={field.label} onChange={e => {
                        const copy = [...data.form_fields]; copy[i].label = e.target.value; update('form_fields', copy);
                      }} placeholder="Field label" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={field.type} onValueChange={v => {
                        const copy = [...data.form_fields]; copy[i].type = v; update('form_fields', copy);
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['text', 'number', 'file', 'dropdown', 'checkbox', 'radio'].map(t => (
                            <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch checked={field.required} onCheckedChange={v => {
                        const copy = [...data.form_fields]; copy[i].required = v; update('form_fields', copy);
                      }} />
                      <Label className="text-xs">Required</Label>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => update('form_fields', data.form_fields.filter((_, idx) => idx !== i))}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addFormField}>+ Add Form Field</Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Switch checked={data.blind_review_enabled} onCheckedChange={v => update('blind_review_enabled', v)} />
                <Label>Enable Blind Review Mode</Label>
              </div>
              <p className="text-sm text-muted-foreground">Configure review stages and minimum score thresholds.</p>
              {data.review_stages.map((stage, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Stage Name</Label>
                      <Input value={stage.name} onChange={e => {
                        const copy = [...data.review_stages]; copy[i].name = e.target.value; update('review_stages', copy);
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Minimum Score</Label>
                      <Input type="number" value={stage.min_score} onChange={e => {
                        const copy = [...data.review_stages]; copy[i].min_score = Number(e.target.value); update('review_stages', copy);
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Programme Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{data.name || '—'}</span></div>
                <div><span className="text-muted-foreground">Category:</span> <span className="font-medium capitalize">{data.category}</span></div>
                <div><span className="text-muted-foreground">Budget:</span> <span className="font-medium">${data.total_budget?.toLocaleString()}</span></div>
                <div><span className="text-muted-foreground">Max Participants:</span> <span className="font-medium">{data.max_participants}</span></div>
                <div><span className="text-muted-foreground">Start:</span> <span className="font-medium">{data.start_date || 'TBD'}</span></div>
                <div><span className="text-muted-foreground">Deadline:</span> <span className="font-medium">{data.application_deadline || 'TBD'}</span></div>
                <div><span className="text-muted-foreground">Form Fields:</span> <span className="font-medium">{data.form_fields.length}</span></div>
                <div><span className="text-muted-foreground">Review Stages:</span> <span className="font-medium">{data.review_stages.length}</span></div>
              </div>
              {data.description && <p className="text-sm text-muted-foreground">{data.description}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-1" /> Save Draft
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handlePublish} className="bg-primary hover:bg-primary/90">
              <Rocket className="h-4 w-4 mr-1" /> Publish Programme
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}