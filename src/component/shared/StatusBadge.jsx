import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200', tooltip: 'Not yet published' },
  planning: { label: 'Planning', className: 'bg-blue-50 text-blue-700 border-blue-200', tooltip: 'Programme is being planned' },
  application: { label: 'Open', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', tooltip: 'Accepting applications' },
  selection: { label: 'Selection', className: 'bg-amber-50 text-amber-700 border-amber-200', tooltip: 'Reviewing and selecting applicants' },
  implementation: { label: 'Active', className: 'bg-purple-50 text-purple-700 border-purple-200', tooltip: 'Programme is running' },
  completion: { label: 'Completed', className: 'bg-slate-100 text-slate-600 border-slate-200', tooltip: 'Programme has ended' },
  archived: { label: 'Archived', className: 'bg-gray-50 text-gray-500 border-gray-200', tooltip: 'Programme is archived' },
  submitted: { label: 'Submitted', className: 'bg-blue-50 text-blue-700 border-blue-200', tooltip: 'Application has been submitted' },
  under_review: { label: 'Under Review', className: 'bg-amber-50 text-amber-700 border-amber-200', tooltip: 'Application is being reviewed' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', tooltip: 'Application approved' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200', tooltip: 'Application rejected' },
  shortlisted: { label: 'Shortlisted', className: 'bg-indigo-50 text-indigo-700 border-indigo-200', tooltip: 'Applicant has been shortlisted' },
  waitlisted: { label: 'Waitlisted', className: 'bg-orange-50 text-orange-700 border-orange-200', tooltip: 'Placed on waitlist' },
  withdrawn: { label: 'Withdrawn', className: 'bg-gray-50 text-gray-500 border-gray-200', tooltip: 'Application withdrawn' },
  pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200', tooltip: 'Awaiting action' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', tooltip: 'Completed' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-50 text-blue-700 border-blue-200', tooltip: 'Scheduled for future' },
  active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200', tooltip: 'Currently active' },
  inactive: { label: 'Inactive', className: 'bg-gray-100 text-gray-500 border-gray-200', tooltip: 'Not active' },
  suspended: { label: 'Suspended', className: 'bg-red-50 text-red-600 border-red-200', tooltip: 'Account suspended' },
};

export default function StatusBadge({ status, className: extraClassName }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200', tooltip: status };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn("font-medium text-xs border", config.className, extraClassName)}>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent><p className="text-xs">{config.tooltip}</p></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}