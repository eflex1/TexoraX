import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, Sparkles, Briefcase, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_CONFIG = {
  applicant: {
    title: "Complete Your Profile",
    description: "Tell us a bit about yourself so we can match you with the right opportunities.",
    question: "What are your core interests?",
    icon: Sparkles,
    color: "text-amber-500",
    options: ["Web3 & Blockchain", "Software Development", "Cloud Infrastructure", "Sustainability", "HealthTech", "EdTech", "FinTech", "Agriculture"]
  },
  donor: {
    title: "Set Your Investment Preferences",
    description: "Help us understand your funding thesis so we can curate the best startups.",
    question: "Which sectors are you interested in funding?",
    icon: Target,
    color: "text-emerald-500",
    options: ["Seed Stage", "Social Impact", "B2B SaaS", "DeepTech", "ClimateTech", "Female Founders", "FinTech", "Healthcare"]
  },
  reviewer: {
    title: "Set Your Areas of Expertise",
    description: "Select your professional domains so we can assign you relevant applications.",
    question: "What is your primary expertise?",
    icon: Briefcase,
    color: "text-indigo-500",
    options: ["Technical Architecture", "Financial Modeling", "Business Strategy", "UI/UX & Product", "Go-To-Market", "Legal & Compliance", "Impact Assessment"]
  },
  admin: {
    title: "Configure Admin Profile",
    description: "Set up your management profile to help organize your programme dashboard.",
    question: "What are your organization's primary focus areas?",
    icon: Target,
    color: "text-blue-500",
    options: ["Early-Stage Startups", "SME Development", "Tech Innovation", "Youth Empowerment", "Women in Tech", "Rural Development", "Policy & Research"]
  }
};

export default function ProfileSetupModal() {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasName = !!user?.full_name;
  const hasInterests = !!user?.interests;

  useEffect(() => {
    if (user && (!hasName || !hasInterests)) {
      setIsOpen(true);
      if (hasName) setFullName(user.full_name);
    }
  }, [user, hasName, hasInterests]);

  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.applicant;
  const ActiveIcon = config.icon;

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasName && !fullName.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const interestsString = selectedTags.join(', ');

      await base44.auth.updateProfile({
        userId: user.id,
        full_name: fullName,
        interests: interestsString
      });
      
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to update profile", error);
      setErrorMsg('Failed to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      {/* MOBILE RESPONSIVE UPDATES HERE */}
      <DialogContent 
        className="sm:max-w-md w-[95vw] max-h-[90dvh] overflow-y-auto p-5 sm:p-6 rounded-2xl" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-left sm:text-center">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <UserCircle className="h-5 w-5 text-primary" /> 
            {hasName ? `Welcome, ${user.full_name.split(' ')[0]}!` : config.title}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {hasName ? "You're almost there. " : ""}{config.description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-2 sm:py-4">
          
          {!hasName && (
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g. Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
                className="h-12 sm:h-11" /* Larger touch target on mobile */
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ActiveIcon className={cn("h-4 w-4", config.color)} /> 
              {config.question} <span className="text-muted-foreground font-normal text-xs">(Select all that apply)</span>
            </Label>
            <div className="flex flex-wrap gap-2 sm:gap-2">
              {config.options.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-4 py-2 sm:px-3 sm:py-1.5 text-sm sm:text-xs font-medium rounded-full border transition-all duration-200", /* Better thumb sizing */
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-200 text-center">
              {errorMsg}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12" /* Larger touch target on mobile */
            disabled={loading || (!hasName && !fullName.trim()) || selectedTags.length === 0}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Profile...</>
            ) : (
              "Save & Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}