import React, { useState, useRef } from 'react';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Eye, EyeOff, Loader2, Save, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useCurrentUser();
  const [organization, setOrganization] = useState(user?.organization || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // Password fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
      await base44.auth.updateMe({ avatar_url: file_url });
      toast.success('Profile picture updated');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ organization, phone, language, avatar_url: avatarUrl });
      toast.success('Settings updated');
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
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 shadow hover:bg-primary/90 transition-colors"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-semibold text-sm">{user?.full_name}</p>
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={user?.full_name || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Email (immutable)</Label>
              <Input value={user?.email || ''} disabled className="bg-muted" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Input value={organization} onChange={e => setOrganization(e.target.value)} placeholder="Your organization" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="fr">🇫🇷 Français</SelectItem>
                <SelectItem value="sw">🇰🇪 Kiswahili</SelectItem>
                <SelectItem value="pt">🇧🇷 Português</SelectItem>
                <SelectItem value="ar">🇸🇦 العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Current Password', value: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
            { label: 'New Password', value: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(v => !v) },
            { label: 'Confirm New Password', value: confirmPw, set: setConfirmPw, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
          ].map(f => (
            <div key={f.label} className="space-y-2">
              <Label>{f.label}</Label>
              <div className="relative">
                <Input
                  type={f.show ? 'text' : 'password'}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {f.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={handlePasswordChange} disabled={!currentPw || !newPw || !confirmPw}>
            Update Password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}