import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function Rubrics() {
  const [showCreate, setShowCreate] = useState(false);
  const [rubric, setRubric] = useState({ name: '', description: '', scoring_scale: '1-5', criteria: [] });
  const queryClient = useQueryClient();

  const { data: rubrics = [] } = useQuery({
    queryKey: ['rubrics'],
    queryFn: () => base44.entities.Rubric.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Rubric.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      setShowCreate(false);
      setRubric({ name: '', description: '', scoring_scale: '1-5', criteria: [] });
      toast.success('Rubric created');
    },
  });

  const addCriterion = () => {
    setRubric(prev => ({
      ...prev,
      criteria: [...prev.criteria, { id: `c_${Date.now()}`, name: '', description: '', max_score: 5, weight: 1 }]
    }));
  };

  const updateCriterion = (i, field, value) => {
    const copy = [...rubric.criteria];
    copy[i][field] = value;
    setRubric(prev => ({ ...prev, criteria: copy }));
  };

  const totalWeight = rubric.criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluation Rubrics"
        description="Create and manage scoring rubrics for application reviews"
        actions={
          <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" /> New Rubric
          </Button>
        }
      />

      {rubrics.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No rubrics yet" description="Create evaluation rubrics to score applications"
          action={<Button onClick={() => setShowCreate(true)} size="sm">Create Rubric</Button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rubrics.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-1">{r.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{r.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{r.criteria?.length || 0} criteria</Badge>
                  <Badge variant="outline">{r.scoring_scale}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Evaluation Rubric</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rubric Name</Label>
                <Input value={rubric.name} onChange={e => setRubric(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Scoring Scale</Label>
                <Select value={rubric.scoring_scale} onValueChange={v => setRubric(prev => ({ ...prev, scoring_scale: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-5">1-5</SelectItem>
                    <SelectItem value="1-10">1-10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={rubric.description} onChange={e => setRubric(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Criteria ({totalWeight > 0 ? `Total weight: ${totalWeight}` : 'Add criteria'})</Label>
                <Button variant="outline" size="sm" onClick={addCriterion}><Plus className="h-3 w-3 mr-1" /> Add</Button>
              </div>
              {rubric.criteria.map((c, i) => (
                <div key={c.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input value={c.name} onChange={e => updateCriterion(i, 'name', e.target.value)} placeholder="Criterion name" className="flex-1" />
                    <Input type="number" value={c.weight} onChange={e => updateCriterion(i, 'weight', Number(e.target.value))} className="w-20" placeholder="Wt" />
                    <Button variant="ghost" size="icon" onClick={() => setRubric(prev => ({ ...prev, criteria: prev.criteria.filter((_, idx) => idx !== i) }))}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <Input value={c.description} onChange={e => updateCriterion(i, 'description', e.target.value)} placeholder="Criterion description" className="text-sm" />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(rubric)} disabled={!rubric.name}>Create Rubric</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}