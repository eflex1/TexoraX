import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';

const DECLARATION_TEXT = `I hereby declare that I have no financial, personal, or institutional conflict of interest with this applicant or startup I am assigned to review.

I confirm that:

1. I have no direct or indirect financial interest in this applicant organisation.
2. I have no personal, familial, or close professional relationship with this applicant that could bias my evaluation.
3. I will immediately disclose any potential conflict that arises and recuse myself from this review.
4. I understand that a false declaration may result in removal from the review panel.

By signing this declaration, I commit to conducting a fair, impartial, and confidential evaluation of this startup.`;

/**
 * NCOIGate — Per-startup (application) NCOI signing.
 * Props:
 *   applicationId  — required, the specific startup being reviewed
 *   applicantName  — display name of the startup/applicant
 *   reviewerEmail
 *   reviewerName
 *   children       — rendered only after NCOI is signed
 */
export default function NCOIGate({ applicationId, applicantName, reviewerEmail, reviewerName, children }) {
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);

  const { data: declarations = [], isLoading } = useQuery({
    queryKey: ['ncoi-app', reviewerEmail, applicationId],
    queryFn: () => base44.entities.NCOIDeclaration.filter(
      { reviewer_email: reviewerEmail, programme_id: applicationId },
      '-created_date', 1
    ),
    enabled: !!reviewerEmail && !!applicationId,
  });

  const signMutation = useMutation({
    mutationFn: () => base44.entities.NCOIDeclaration.create({
      reviewer_email: reviewerEmail,
      reviewer_name: reviewerName,
      programme_id: applicationId, // reusing programme_id field to store application-level NCOI
      programme_name: applicantName,
      signed_at: new Date().toISOString(),
      declaration_text: DECLARATION_TEXT,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ncoi-app', reviewerEmail, applicationId] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const signed = declarations.length > 0;
  if (signed) return <>{children}</>;

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle>Non-Conflict of Interest Declaration</DialogTitle>
              <DialogDescription>
                Required before reviewing <strong>{applicantName || 'this startup'}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto border">
          {DECLARATION_TEXT}
        </div>

        <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3 border border-amber-200">
          <Checkbox id="ncoi-agree" checked={agreed} onCheckedChange={setAgreed} className="mt-0.5" />
          <Label htmlFor="ncoi-agree" className="text-sm font-medium cursor-pointer leading-relaxed">
            I have read and understand this declaration. I confirm there is no conflict of interest in my reviewing <strong>{applicantName || 'this startup'}</strong>.
          </Label>
        </div>

        <DialogFooter>
          <Button
            onClick={() => signMutation.mutate()}
            disabled={!agreed || signMutation.isPending}
            className="w-full"
          >
            <Shield className="h-4 w-4 mr-2" />
            {signMutation.isPending ? 'Signing...' : 'Sign NCOI Declaration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}