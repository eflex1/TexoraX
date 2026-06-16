import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import StatsCard from '@/components/shared/StatsCard';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { FileText, ClipboardCheck, Clock, Shield } from 'lucide-react';

export default function ReviewerDashboard() {
  const { user } = useCurrentUser();
  const [showCOI, setShowCOI] = useState(false);
  const [coiAccepted, setCoiAccepted] = useState(false);

  React.useEffect(() => {
    if (user && user.role === 'reviewer' && !user.coi_signed) {
      setShowCOI(true);
    }
  }, [user]);

  const { data: reviews = [] } = useQuery({
    queryKey: ['my-reviews', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['reviewer-applications', user?.email],
    queryFn: async () => {
      const allApps = await base44.entities.Application.list('-created_date', 200);
      return allApps.filter(a => a.assigned_reviewers?.includes(user?.email));
    },
    enabled: !!user?.email,
  });

  const handleSignCOI = async () => {
    // FIX: Changed 'updateMe' to 'updateProfile' to match our custom backend proxy
    await base44.auth.updateProfile({
      userId: user.id,
      coi_signed: true,
      coi_signed_date: new Date().toISOString()
    });
    setShowCOI(false);
    window.location.reload();
  };

  const assignedCount = applications.length;
  const completedReviews = reviews.filter(r => r.status === 'completed').length;
  const pendingReviews = reviews.filter(r => r.status === 'assigned' || r.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <Dialog open={showCOI} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Conflict of Interest Declaration
            </DialogTitle>
            <DialogDescription>
              You must sign this declaration before accessing your review queue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              I hereby declare that I have no financial, personal, or institutional conflict of interest
              with any programme or applicant I am assigned to review. I will disclose any potential
              conflicts immediately and recuse myself from affected reviews.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox id="coi" checked={coiAccepted} onCheckedChange={setCoiAccepted} />
              <Label htmlFor="coi" className="text-sm">I confirm and agree to this declaration</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSignCOI} disabled={!coiAccepted} className="w-full">
              Sign Declaration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Reviewer'}`}
        description="Your review assignments and progress"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Assigned Applications" value={assignedCount} icon={FileText}
          tooltip="Total applications assigned to you" />
        <StatsCard title="Pending Reviews" value={pendingReviews} icon={Clock}
          tooltip="Reviews you need to complete" />
        <StatsCard title="Completed Reviews" value={completedReviews} icon={ClipboardCheck}
          tooltip="Reviews you have submitted" />
      </div>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Your Assigned Applications</CardTitle>
          <Link to="/reviews"><Button variant="outline" size="sm">View All</Button></Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {applications.slice(0, 8).map(app => (
              <div key={app.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{app.applicant_name || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">{app.programme_name} · {app.current_stage?.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={app.status} />
                  <Link to={`/reviews/${app.id}`}>
                    <Button variant="outline" size="sm">Review</Button>
                  </Link>
                </div>
              </div>
            ))}
            {applications.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No applications assigned yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}