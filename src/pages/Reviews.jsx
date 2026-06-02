import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import NCOIGate from '@/components/reviewer/NCOIGate';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Reviews() {
  const { user } = useCurrentUser();
  const [selectedApp, setSelectedApp] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [ncioApp, setNcioApp] = useState(null); // app pending NCOI sign
  const queryClient = useQueryClient();

  const { data: applications = [] } = useQuery({
    queryKey: ['reviewer-apps', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Application.list('-created_date', 200);
      return all.filter(a => a.assigned_reviewers?.includes(user?.email));
    },
    enabled: !!user?.email,
  });

  // Fetch all NCOI declarations for this reviewer (all applications)
  const { data: declarations = [] } = useQuery({
    queryKey: ['ncoi-all', user?.email],
    queryFn: () => base44.entities.NCOIDeclaration.filter({ reviewer_email: user?.email }, '-created_date', 200),
    enabled: !!user?.email,
  });

  const signedAppIds = new Set(declarations.map(d => d.programme_id)); // programme_id stores applicationId

  const submitReview = useMutation({
    mutationFn: (review) => base44.entities.Review.create(review),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviewer-apps'] });
      setSelectedApp(null);
      setScores({});
      setFeedback('');
      toast.success('Review submitted');
    },
  });

  const handleReviewClick = (app) => {
    if (!signedAppIds.has(app.id)) {
      setNcioApp(app);
    } else {
      setSelectedApp(app);
      setScores({});
      setFeedback('');
    }
  };

  const handleSubmit = () => {
    const scoreEntries = Object.entries(scores).map(([name, score]) => ({
      criterion_name: name, score, max_score: 5, weight: 1,
    }));
    const totalScore = scoreEntries.reduce((sum, s) => sum + s.score, 0) / (scoreEntries.length || 1);

    submitReview.mutate({
      application_id: selectedApp.id,
      programme_id: selectedApp.programme_id,
      reviewer_email: user?.email,
      stage: selectedApp.current_stage || 'screening',
      scores: scoreEntries,
      total_score: totalScore,
      feedback,
      status: 'completed',
      decision: 'pending',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Reviews" description="Review assigned applications" />

      {/* Per-application NCOI gate — shows as a blocking modal */}
      {ncioApp && (
        <NCOIGate
          applicationId={ncioApp.id}
          applicantName={ncioApp.applicant_name || ncioApp.organization_name || 'this startup'}
          reviewerEmail={user?.email}
          reviewerName={user?.full_name}
        >
          {/* Once signed, close gate and open review dialog */}
          {(() => {
            queryClient.invalidateQueries({ queryKey: ['ncoi-all', user?.email] });
            setSelectedApp(ncioApp);
            setNcioApp(null);
            setScores({});
            setFeedback('');
            return null;
          })()}
        </NCOIGate>
      )}

      {applications.length === 0 ? (
        <EmptyState icon={FileText} title="No assigned applications" description="Applications will appear here once assigned to you" />
      ) : (
        <div className="space-y-3">
          {applications.map(app => {
            const ncoisSigned = signedAppIds.has(app.id);
            return (
              <Card key={app.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {app.applicant_name || 'Anonymous Applicant'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.programme_name} · Stage: {app.current_stage?.replace(/_/g, ' ')}
                    </p>
                    {!ncoisSigned && (
                      <p className="text-xs text-amber-600 mt-0.5">⚠ NCOI signature required before reviewing</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={app.status} />
                    <Button size="sm" onClick={() => handleReviewClick(app)}>
                      <Star className="h-3 w-3 mr-1" /> Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review: {selectedApp?.applicant_name || 'Application'}</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4 py-2">
              <div className="bg-muted rounded-lg p-3 text-sm">
                <p><strong>Programme:</strong> {selectedApp.programme_name}</p>
                <p><strong>Stage:</strong> {selectedApp.current_stage?.replace(/_/g, ' ')}</p>
                <p><strong>Sector:</strong> {selectedApp.sector || '—'}</p>
              </div>

              <div className="space-y-3">
                <Label className="font-semibold">Scoring (1–5)</Label>
                {['Innovation', 'Feasibility', 'Impact', 'Team Strength', 'Scalability'].map(criterion => (
                  <div key={criterion} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{criterion}</span>
                      <span className="font-medium">{scores[criterion] || 0}/5</span>
                    </div>
                    <Slider min={0} max={5} step={1} value={[scores[criterion] || 0]}
                      onValueChange={([v]) => setScores(prev => ({ ...prev, [criterion]: v }))} />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="font-semibold">Overall Feedback</Label>
                <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} placeholder="Provide detailed feedback..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedApp(null)}>Cancel</Button>
            <Button onClick={handleSubmit}><CheckCircle2 className="h-4 w-4 mr-1" /> Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}