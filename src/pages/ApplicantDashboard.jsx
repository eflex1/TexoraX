import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import StatsCard from '@/components/shared/StatsCard';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import ApplicationStageTracker from '@/components/applicant/ApplicationStageTracker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle2, Eye, Pencil, ChevronRight, X } from 'lucide-react';
import { format } from 'date-fns';

export default function ApplicantDashboard() {
  const { user } = useCurrentUser();
  const [trackingApp, setTrackingApp] = useState(null);

  const { data: applications = [] } = useQuery({
    queryKey: ['my-applications', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Application.list('-updated_date', 100);
      return all.filter(a =>
        a.applicant_email === user?.email ||
        a.team_members?.some(m => m.email === user?.email)
      );
    },
    enabled: !!user?.email,
  });

  const drafts = applications.filter(a => a.status === 'draft');
  const submitted = applications.filter(a => ['submitted', 'under_review', 'shortlisted'].includes(a.status));
  const approved = applications.filter(a => a.status === 'approved');

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.full_name?.split(' ')[0] || 'Applicant'}`}
        description="Manage your applications and track progress"
        actions={
          <Link to="/programmes">
            <Button className="bg-primary hover:bg-primary/90">Browse Programmes</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Drafts" value={drafts.length} icon={Pencil} tooltip="Applications still in progress" />
        <StatsCard title="In Review" value={submitted.length} icon={Clock} tooltip="Submitted and under consideration" />
        <StatsCard title="Approved" value={approved.length} icon={CheckCircle2} tooltip="Approved applications" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">My Applications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map(app => (
            <Card key={app.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{app.programme_name || 'Untitled Programme'}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{app.organization_name}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Form Completion</span>
                          <span className="font-medium">{app.completion_percentage || 0}%</span>
                        </div>
                        <Progress value={app.completion_percentage || 0} className="h-1.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent><p className="text-xs">Application is {app.completion_percentage || 0}% complete</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {app.team_members && app.team_members.length > 0 && (
                  <div className="flex items-center gap-1 mb-3">
                    {app.team_members.slice(0, 3).map((m, i) => (
                      <TooltipProvider key={i}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className="h-6 w-6 border-2 border-card -ml-1 first:ml-0">
                              <AvatarFallback className="text-[10px] bg-muted">
                                {m.name ? m.name.split(' ').map(n => n[0]).join('') : m.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">{m.name || m.email} ({m.role})</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {app.team_members.length > 3 && (
                      <span className="text-xs text-muted-foreground ml-1">+{app.team_members.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {app.status === 'draft' ? (
                    <Link to={`/my-applications/${app.id}/edit`} className="flex-1">
                      <Button variant="default" size="sm" className="w-full">
                        <Pencil className="h-3 w-3 mr-1.5" /> Continue Editing
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/my-applications/${app.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-3 w-3 mr-1.5" /> View
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTrackingApp(app)}
                    className="flex-shrink-0 text-primary text-xs gap-1"
                  >
                    Track <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {applications.length === 0 && (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center py-12">
                <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">No applications yet</p>
                <p className="text-xs text-muted-foreground mb-4">Browse programmes and start your first application</p>
                <Link to="/programmes"><Button size="sm">Browse Programmes</Button></Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Stage Tracker Dialog */}
      {trackingApp && (
        <Dialog open={!!trackingApp} onOpenChange={() => setTrackingApp(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Application Progress</span>
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{trackingApp.programme_name}</p>
            </DialogHeader>
            <div className="py-2">
              <ApplicationStageTracker application={trackingApp} />
            </div>
            {trackingApp.submission_date && (
              <p className="text-xs text-muted-foreground border-t pt-3 mt-1">
                Submitted on {format(new Date(trackingApp.submission_date), 'MMMM d, yyyy')}
              </p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}