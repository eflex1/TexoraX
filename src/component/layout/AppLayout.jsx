import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function AppLayout() {
  const { user } = useCurrentUser();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['unread-notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user?.email, is_read: false }, '-created_date', 50),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });

  const role = user?.role || 'applicant';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        role={role}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "lg:ml-[68px]" : "lg:ml-[250px]"
      )}>
        <TopBar
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          notificationCount={notifications.length}
        />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}