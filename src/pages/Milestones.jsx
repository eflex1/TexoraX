import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { GraduationCap } from 'lucide-react';

export default function Milestones() {
  return (
    <div className="space-y-6">
      <PageHeader title="Milestones & Progress" description="Track your milestones and deliverables" />
      <EmptyState icon={GraduationCap} title="No milestones yet" description="Milestones will appear here once assigned to your programme" />
    </div>
  );
}