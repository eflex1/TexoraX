import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, Star } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewHistory() {
  const { user } = useCurrentUser();

  const { data: reviews = [] } = useQuery({
    queryKey: ['review-history', user?.email],
    queryFn: () => base44.entities.Review.filter({ reviewer_email: user?.email, status: 'completed' }, '-created_date', 100),
    enabled: !!user?.email,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Review History" description="Your completed reviews and submitted scores" />

      {reviews.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No review history" description="Completed reviews will appear here" />
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Application #{r.application_id?.slice(-6)}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {r.stage?.replace(/_/g, ' ')} · {format(new Date(r.created_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-semibold">{r.total_score?.toFixed(1) || '—'}</span>
                  </div>
                  <Badge variant="secondary" className={
                    r.decision === 'approve' ? 'bg-emerald-50 text-emerald-700' :
                    r.decision === 'reject' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                  }>{r.decision || 'pending'}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}