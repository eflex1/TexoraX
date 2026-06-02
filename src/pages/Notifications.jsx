import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, FileText, MessageSquare, Users, Wallet, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const typeIcons = {
  new_application: FileText,
  status_change: CheckCheck,
  new_message: MessageSquare,
  milestone_due: Calendar,
  disbursement_scheduled: Wallet,
  new_user_joined: Users,
  coi_escalation: AlertTriangle,
  review_assigned: FileText,
  comment_mention: MessageSquare,
  team_activity: Users,
  chat_message: MessageSquare,
  monthly_report: FileText,
};

export default function Notifications() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email }, '-created_date', 100),
    enabled: !!user?.email,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = () => {
    notifications.filter(n => !n.is_read).forEach(n => markReadMutation.mutate(n.id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={unreadCount > 0 && <Button variant="outline" size="sm" onClick={markAllRead}><CheckCheck className="h-4 w-4 mr-1" /> Mark All Read</Button>}
      />

      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const Icon = typeIcons[n.type] || Bell;
            return (
              <Card key={n.id} className={cn("transition-colors", !n.is_read && "border-l-2 border-l-primary bg-primary/[0.02]")}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg shrink-0", !n.is_read ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("h-4 w-4", !n.is_read ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", !n.is_read && "font-medium")}>{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_date), 'MMM d, yyyy · HH:mm')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(n.id)}>Mark Read</Button>
                    )}
                    {n.link && (
                      <Link to={n.link}><Button variant="outline" size="sm">View</Button></Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}