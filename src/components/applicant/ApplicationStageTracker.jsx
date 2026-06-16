import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, XCircle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STAGES = [
  {
    key: 'draft',
    label: 'Application Started',
    description: 'Complete all required sections',
    tasks: ['Fill in basic details', 'Add team members', 'Upload documents'],
  },
  {
    key: 'submitted',
    label: 'Submitted',
    description: 'Your application has been received',
    tasks: ['Await initial screening', 'Ensure contact email is active'],
  },
  {
    key: 'under_review',
    label: 'Under Review',
    description: 'Reviewers are evaluating your application',
    tasks: ['Panel review in progress', 'You may be contacted for clarification'],
  },
  {
    key: 'shortlisted',
    label: 'Shortlisted',
    description: 'You have been shortlisted for further consideration',
    tasks: ['Await final decision', 'Prepare for potential interview'],
  },
  {
    key: 'approved',
    label: 'Approved',
    description: 'Congratulations! Your application was approved.',
    tasks: ['Await onboarding communication', 'Sign programme agreement'],
  },
];

const TERMINAL_NEGATIVE = ['rejected', 'withdrawn', 'waitlisted'];

function getStageIndex(status) {
  const map = {
    draft: 0,
    submitted: 1,
    under_review: 2,
    shortlisted: 3,
    approved: 4,
    rejected: 2,
    waitlisted: 2,
    withdrawn: 1,
  };
  return map[status] ?? 0;
}

function StageIcon({ state }) {
  if (state === 'done') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
  if (state === 'active') return <Clock className="h-5 w-5 text-primary animate-pulse" />;
  if (state === 'rejected') return <XCircle className="h-5 w-5 text-red-500" />;
  return <Circle className="h-5 w-5 text-gray-300" />;
}

export default function ApplicationStageTracker({ application }) {
  const { status, current_stage, completion_percentage = 0 } = application;
  const isTerminalNeg = TERMINAL_NEGATIVE.includes(status);
  const activeIdx = getStageIndex(status);

  return (
    <div className="space-y-4">
      {/* Mobile: compact horizontal progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:hidden">
        {STAGES.map((stage, idx) => {
          const isDone = isTerminalNeg ? idx < activeIdx : idx < activeIdx;
          const isActive = idx === activeIdx && !isTerminalNeg;
          return (
            <React.Fragment key={stage.key}>
              <div className={cn(
                'flex-shrink-0 h-2 w-2 rounded-full transition-colors',
                isDone ? 'bg-emerald-500' : isActive ? 'bg-primary' : 'bg-gray-200'
              )} />
              {idx < STAGES.length - 1 && (
                <div className={cn('flex-shrink-0 h-0.5 w-6', isDone ? 'bg-emerald-500' : 'bg-gray-200')} />
              )}
            </React.Fragment>
          );
        })}
        <span className="ml-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
          {STAGES[Math.min(activeIdx, STAGES.length - 1)].label}
        </span>
      </div>

      {/* Desktop: full vertical stepper */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[18px] top-5 bottom-5 w-0.5 bg-gray-100" />

          <div className="space-y-0">
            {STAGES.map((stage, idx) => {
              const isDone = idx < activeIdx || (isTerminalNeg && idx < activeIdx);
              const isActive = idx === activeIdx && !isTerminalNeg;
              const isFuture = idx > activeIdx;
              const isRejectedStage = isTerminalNeg && idx === activeIdx;

              return (
                <div key={stage.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Connector line fill */}
                  {isDone && idx < STAGES.length - 1 && (
                    <div className="absolute left-[18px] top-5 h-full w-0.5 bg-emerald-200 z-[1]" />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'relative z-[2] flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all',
                    isDone ? 'bg-emerald-50 border-emerald-300' :
                    isActive ? 'bg-primary/10 border-primary ring-4 ring-primary/10' :
                    isRejectedStage ? 'bg-red-50 border-red-300' :
                    'bg-white border-gray-200'
                  )}>
                    <StageIcon state={isDone ? 'done' : isActive ? 'active' : isRejectedStage ? 'rejected' : 'pending'} />
                  </div>

                  {/* Content */}
                  <div className={cn('flex-1 pt-1.5', isFuture && 'opacity-40')}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('text-sm font-semibold', isActive && 'text-primary')}>
                        {stage.label}
                      </p>
                      {isActive && !isTerminalNeg && (
                        <Badge className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-0">Current</Badge>
                      )}
                      {isRejectedStage && status === 'rejected' && (
                        <Badge className="text-[10px] px-2 py-0 bg-red-50 text-red-600 border-0">Not Progressed</Badge>
                      )}
                      {isRejectedStage && status === 'waitlisted' && (
                        <Badge className="text-[10px] px-2 py-0 bg-amber-50 text-amber-600 border-0">Waitlisted</Badge>
                      )}
                      {isDone && (
                        <Badge className="text-[10px] px-2 py-0 bg-emerald-50 text-emerald-600 border-0">Done</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{stage.description}</p>

                    {/* Tasks — only show for active stage */}
                    {(isActive || isDone) && (
                      <ul className="mt-2 space-y-1">
                        {stage.tasks.map((task, ti) => (
                          <li key={ti} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className={cn('h-3 w-3 flex-shrink-0', isDone ? 'text-emerald-400' : 'text-gray-300')} />
                            {task}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Terminal negative states */}
        {isTerminalNeg && (
          <div className={cn(
            'mt-2 rounded-xl px-4 py-3 border text-sm font-medium',
            status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
            status === 'waitlisted' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-gray-50 border-gray-200 text-gray-600'
          )}>
            {status === 'rejected' && '⚠️ This application was not successful. You may apply to other programmes.'}
            {status === 'waitlisted' && '⏳ You are on the waitlist. We will notify you if a spot opens up.'}
            {status === 'withdrawn' && 'You have withdrawn this application.'}
          </div>
        )}
      </div>
    </div>
  );
}