import React, { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserCircle, Sparkles, Briefcase, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

// 1. The Intelligence Dictionary: Different tags for different roles
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

  useEffect(() => {
    if (user && !user.full_name) {
      setIsOpen(true);
    }
  }, [user]);

  // Fallback to 'applicant' if the role is missing for some reason
  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.applicant;
  const ActiveIcon = config.icon;

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    
    setLoading(true);
    setErrorMsg('');
    
    try {
      const interestsString = selectedTags.join(', ');

      await base44.auth.updateProfile({
        userId: user.id,
        full_name: fullName,
        interests: interestsString // Saving to our generic DB column!
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
      <DialogContent 
        className="sm:max-w-md" 
        onPointerDownOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" /> {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
            <Input
              id="fullName"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ActiveIcon className={cn("h-4 w-4", config.color)} /> 
              {config.question} (Select all that apply)
            </Label>
            <div className="flex flex-wrap gap-2">
              {config.options.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200",
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

          <Button type="submit" className="w-full h-11" disabled={loading || !fullName.trim()}>
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