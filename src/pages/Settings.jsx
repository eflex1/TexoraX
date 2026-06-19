import React, { useState, useEffect, useRef } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Eye, EyeOff, Loader2, Save, Lock, Sparkles, Target, Briefcase, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authService } from '@/api/apiClient';

const ROLE_CONFIG = {
  applicant: {
    question: "Your Core Interests",
    icon: Sparkles, color: "text-amber-500",
    orgLabel: "Startup / Company Name",
    options: ["Web3 & Blockchain", "Software Development", "Cloud Infrastructure", "Sustainability", "HealthTech", "EdTech", "FinTech", "Agriculture"]
  },
  donor: {
    question: "Investment Sectors",
    icon: Target, color: "text-emerald-500",
    orgLabel: "Fund / Foundation Name",
    options: ["Seed Stage", "Social Impact", "B2B SaaS", "DeepTech", "ClimateTech", "Female Founders", "FinTech", "Healthcare"]
  },
  reviewer: {
    question: "Areas of Expertise",
    icon: Briefcase, color: "text-indigo-500",
    orgLabel: null, // Reviewers don't need this!
    options: ["Technical Architecture", "Financial Modeling", "Business Strategy", "UI/UX & Product", "Go-To-Market", "Legal & Compliance", "Impact Assessment"]
  },
  admin: {
    question: "Organization Focus Areas",
    icon: Target, color: "text-blue-500",
    orgLabel: "Organization Name",
    options: ["Early-Stage Startups", "SME Development", "Tech Innovation", "Youth Empowerment", "Women in Tech", "Rural Development", "Policy & Research"]
  }
};

export default function Settings() {
  const { user } = useCurrentUser();
  
  const [fullName, setFullName] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [organization, setOrganization] = useState('');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('en');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setSelectedTags(user.interests ? user.interests.split(', ').filter(Boolean) : []);
      setOrganization(user.organization || '');
      setPhone(user.phone || '');
      setLanguage(user.language || 'en');
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const config = ROLE_CONFIG[user?.role] || ROLE_CONFIG.applicant;
  const ActiveIcon = config.icon;
  const showOrganization = user?.role !== 'reviewer'; // HIDE FOR REVIEWERS

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. Send the file to Node.js -> Cloudinary
      const { file_url } = await authService.uploadFile(file); // Make sure you import authService at the top!
      
      // 2. Update the local UI instantly
      setAvatarUrl(file_url);
      
      // 3. Save the new URL to MySQL!
      await authService.updateProfile({ 
        userId: user.id, 
        avatar_url: file_url // NOTE: You will need to add avatar_url to your MySQL User model later to make it permanent!
      });
      
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const interestsString = selectedTags.join(', ');
      
      await base44.auth.updateProfile({ 
        userId: user.id,
        full_name: fullName, 
        interests: interestsString,
        phone,
        organization: showOrganization ? organization : null, // Send null if reviewer
        language
      });
      
      toast.success('Settings saved successfully!');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match'); return; }
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    toast.success('Password change is processed via the reset password flow. Check your email for a reset link.');
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" description="Manage your account and preferences" />

      {/* Profile Picture */}
      <Card>
        <CardHeader><CardTitle className="text-base">Profile Picture</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 shadow hover:bg-primary/90 transition-colors">
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-semibold text-sm">{fullName || 'No Name Set'}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Change Photo'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Profile Details</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your Name" />
            </div>
            <div className="space-y-2">
              <Label>Email (immutable)</Label>
              <Input value={user?.email || ''} disabled className="bg-muted text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <ActiveIcon className={cn("h-4 w-4", config.color)} /> 
              {config.question}
            </Label>
            <div className="flex flex-wrap gap-2">
              {config.options.map(tag => (
                <button
                  key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200",
                    selectedTags.includes(tag) ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-muted/30 text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            {/* CONDITIONAL RENDER FOR ORGANIZATION */}
            {showOrganization && (
              <div className="space-y-2">
                <Label>{config.orgLabel}</Label>
                <Input value={organization} onChange={e => setOrganization(e.target.value)} placeholder={`Enter ${config.orgLabel.toLowerCase()}`} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="sw">🇰🇪 Kiswahili</SelectItem>
                <SelectItem value="pt">🇧🇷 Português</SelectItem>
                <SelectItem value="ar">🇸🇦 العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving || !fullName.trim() || selectedTags.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Current Password */}
          <div className="space-y-2">
            <Label>Current Password</Label>
            <div className="relative">
              <Input type={showCurrent ? 'text' : 'password'} value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password WITH CHECKLIST */}
          <div className="space-y-2">
            <Label>New Password</Label>
            <div className="relative">
              <Input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* REAL-TIME CHECKLIST */}
            {newPw.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-muted/30 rounded-lg border">
                <div className={cn("text-xs flex items-center gap-1.5 transition-colors", newPw.length >= 8 ? "text-emerald-600" : "text-muted-foreground")}>
                  {newPw.length >= 8 ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 8+ characters
                </div>
                <div className={cn("text-xs flex items-center gap-1.5 transition-colors", /[A-Z]/.test(newPw) ? "text-emerald-600" : "text-muted-foreground")}>
                  {/[A-Z]/.test(newPw) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 1 uppercase
                </div>
                <div className={cn("text-xs flex items-center gap-1.5 transition-colors", /[0-9]/.test(newPw) ? "text-emerald-600" : "text-muted-foreground")}>
                  {/[0-9]/.test(newPw) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 1 number
                </div>
                <div className={cn("text-xs flex items-center gap-1.5 transition-colors", /[!@#$%^&*(),.?":{}|<>]/.test(newPw) ? "text-emerald-600" : "text-muted-foreground")}>
                  {/[!@#$%^&*(),.?":{}|<>]/.test(newPw) ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 1 special char
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <div className="relative">
              <Input type={showConfirm ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" 
                className={cn("pr-10 transition-colors", confirmPw.length > 0 && newPw !== confirmPw ? "border-destructive focus-visible:ring-destructive" : "", confirmPw.length > 0 && newPw === confirmPw ? "border-emerald-500 focus-visible:ring-emerald-500" : "")} 
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPw.length > 0 && newPw !== confirmPw && (
              <p className="text-xs text-destructive mt-1 font-medium">Passwords do not match</p>
            )}
          </div>

          <Button 
            onClick={async () => {
              const isPasswordValid = newPw.length >= 8 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[!@#$%^&*(),.?":{}|<>]/.test(newPw);
              if (!isPasswordValid || newPw !== confirmPw) return;

              try {
                await base44.auth.changePassword({ userId: user.id, currentPassword: currentPw, newPassword: newPw });
                toast.success('Password updated securely!');
                setCurrentPw(''); setNewPw(''); setConfirmPw('');
              } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to update password');
              }
            }} 
            disabled={!currentPw || !newPw || !confirmPw || newPw !== confirmPw || !(newPw.length >= 8 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw) && /[!@#$%^&*(),.?":{}|<>]/.test(newPw))}
          >
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}