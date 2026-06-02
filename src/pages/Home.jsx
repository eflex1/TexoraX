import React from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import AdminDashboard from './AdminDashboard';
import ReviewerDashboard from './ReviewerDashboard';
import DonorDashboard from './DonorDashboard';
import ApplicantDashboard from './ApplicantDashboard';

export default function Home() {
  const { user, loading } = useCurrentUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (user?.role) {
    case 'admin': return <AdminDashboard />;
    case 'reviewer': return <ReviewerDashboard />;
    case 'donor': return <DonorDashboard />;
    case 'applicant': return <ApplicantDashboard />;
    default: return <ApplicantDashboard />;
  }
}