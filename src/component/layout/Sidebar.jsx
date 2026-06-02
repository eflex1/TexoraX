import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, FolderKanban, Users, FileText, Wallet,
  GraduationCap, BarChart3, Bell, Settings, MessageSquare,
  ClipboardCheck, Scale, ChevronLeft, ChevronRight, LogOut, X, CreditCard, PiggyBank, Plug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';

const roleNavItems = {
  admin: [
    { label: 'Dashboard', labelKey: 'dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Programmes', labelKey: 'programmes', icon: FolderKanban, path: '/programmes' },
    { label: 'Applications', labelKey: 'applications', icon: FileText, path: '/applications' },
    { label: 'Users', labelKey: 'users', icon: Users, path: '/users' },
    { label: 'Rubrics', icon: ClipboardCheck, path: '/rubrics' },
    { label: 'Grants', labelKey: 'grants', icon: Wallet, path: '/grants' },
    { label: 'Alumni', icon: GraduationCap, path: '/alumni' },
    { label: 'Calibration', icon: Scale, path: '/calibration' },
    { label: 'Analytics', labelKey: 'analytics', icon: BarChart3, path: '/analytics' },
    { label: 'Budget', icon: PiggyBank, path: '/budget' },
    { label: 'Pricing & Plans', icon: CreditCard, path: '/pricing' },
    { label: 'Messages', labelKey: 'messages', icon: MessageSquare, path: '/messages' },
    { label: 'Notifications', labelKey: 'notifications', icon: Bell, path: '/notifications' },
    { label: 'Settings', labelKey: 'settings', icon: Settings, path: '/settings' },
  ],
  reviewer: [
    { label: 'Dashboard', labelKey: 'dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Programmes', labelKey: 'programmes', icon: FolderKanban, path: '/programmes' },
    { label: 'My Reviews', icon: FileText, path: '/reviews' },
    { label: 'Review History', icon: ClipboardCheck, path: '/review-history' },
    { label: 'Messages', labelKey: 'messages', icon: MessageSquare, path: '/messages' },
    { label: 'Notifications', labelKey: 'notifications', icon: Bell, path: '/notifications' },
    { label: 'Settings', labelKey: 'settings', icon: Settings, path: '/settings' },
  ],
  donor: [
    { label: 'Dashboard', labelKey: 'dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Programmes', labelKey: 'programmes', icon: FolderKanban, path: '/programmes' },
    { label: 'Grants', labelKey: 'grants', icon: Wallet, path: '/grants' },
    { label: 'Impact Reports', icon: BarChart3, path: '/impact-reports' },
    { label: 'Messages', labelKey: 'messages', icon: MessageSquare, path: '/messages' },
    { label: 'Notifications', labelKey: 'notifications', icon: Bell, path: '/notifications' },
    { label: 'Settings', labelKey: 'settings', icon: Settings, path: '/settings' },
  ],
  applicant: [
    { label: 'Dashboard', labelKey: 'dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Programmes', labelKey: 'programmes', icon: FolderKanban, path: '/programmes' },
    { label: 'My Applications', labelKey: 'applications', icon: FileText, path: '/my-applications' },
    { label: 'Milestones', icon: GraduationCap, path: '/milestones' },
    { label: 'Messages', labelKey: 'messages', icon: MessageSquare, path: '/messages' },
    { label: 'Notifications', labelKey: 'notifications', icon: Bell, path: '/notifications' },
    { label: 'Settings', labelKey: 'settings', icon: Settings, path: '/settings' },
  ],
};

export default function Sidebar({ role = 'admin', collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const { t } = useLanguage();
  const navItems = roleNavItems[role] || roleNavItems.admin;

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  return (
    <TooltipProvider delayDuration={0}>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[250px]",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border shrink-0", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <img
                src="https://media.base44.com/images/public/6a1461e7a37eb199f332e347/f5a498f57_IMG_9423.png"
                alt="NexoraX"
                className="h-7 w-auto object-contain brightness-[5] saturate-0"
              />
            </Link>
          )}
          {collapsed && (
            <Link to="/">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-white font-bold text-xs">NX</span>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex h-7 w-7"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden h-7 w-7"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            const linkContent = (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span>{t(item.labelKey) || item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full transition-colors",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}