import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { useGoogleLogin } from '@react-oauth/google';
import { apiClient } from '@/api/apiClient';
import { cn } from "@/lib/utils";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
  // New toggles for showing/hiding password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [resendCooldown, setResendCooldown] = useState(0);

  // REAL-TIME PASSWORD VALIDATION ENGINE
  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  const isPasswordValid = Object.values(passwordRules).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!isPasswordValid) {
      setError("Please meet all password requirements.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const selectedRole = queryParams.get('role') || 'applicant'; 

      await base44.auth.register({ email, password, role: selectedRole });
      setShowOtp(true);
      setResendCooldown(60); 
    } catch (err) {
      const actualErrorMessage = err.response?.data?.message || err.message || "Registration failed";
      setError(actualErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/";
    } catch (err) {
      const actualErrorMessage = err.response?.data?.message || err.message || "Invalid verification code";
      setError(actualErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: "Code sent",
        description: "Check your email for the new code.",
      });
      setResendCooldown(60); 
    } catch (err) {
      const actualErrorMessage = err.response?.data?.message || err.message || "Failed to resend code";
      setError(actualErrorMessage);
    }
  };

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError("");
      try {
        const queryParams = new URLSearchParams(window.location.search);
        const selectedRole = queryParams.get('role') || 'applicant'; 

        const response = await apiClient.post('/auth/google-login', {
          token: tokenResponse.access_token,
          role: selectedRole
        });

        localStorage.setItem('texorax_token', response.data.access_token);
        localStorage.setItem('texorax_role', response.data.user.role);
        localStorage.setItem('texorax_user_id', response.data.user.id.toString());
        localStorage.setItem('texorax_email', response.data.user.email);
        localStorage.setItem('texorax_coi_signed', response.data.user.coi_signed?.toString() || 'false');
        localStorage.setItem('texorax_interests', response.data.user.interests || '');
        
        if (response.data.user.full_name) {
          localStorage.setItem('texorax_user_name', response.data.user.full_name);
        }

        window.location.href = "/";
      } catch (err) {
        const actualErrorMessage = err.response?.data?.message || "Google registration failed on the server.";
        setError(actualErrorMessage);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google popup authentication failed.');
    }
  });

  if (showOtp) {
    return (
      <AuthLayout icon={Mail} title="Verify your email" subtitle={`We sent a code to ${email}`}>
        <div className="bg-amber-50 text-amber-600 text-xs p-3 rounded-md mb-4 text-center border border-amber-200">
          <span className="font-semibold">Note:</span> If you don't see the email within a minute, please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
        </div>
        
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>}
        
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        
        <Button className="w-full h-12 font-medium" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify"}
        </Button>
        
        <div className="flex flex-col items-center gap-2 mt-6">
          <p className="text-center text-sm text-muted-foreground">
            Didn't receive the code?{" "}
            <button onClick={handleResend} disabled={resendCooldown > 0} className="text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline transition-colors">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </button>
          </p>
          <p className="text-xs text-amber-600/80 font-medium">Code expires in 15 minutes</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={UserPlus} title="Create your account" subtitle="Sign up to get started" footer={<>Already have an account?{" "}<Link to="/login" className="text-primary font-medium hover:underline">Log in</Link></>}>
      <Button variant="outline" className="w-full h-12 text-sm font-medium mb-6" onClick={() => handleGoogleRegister()} disabled={loading}>
        <GoogleIcon className="w-5 h-5 mr-2" /> Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-3 text-muted-foreground">or</span></div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" required />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 h-12" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* THE REAL-TIME CHECKLIST UI */}
          {password.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-muted/30 rounded-lg border">
              <div className={cn("text-xs flex items-center gap-1.5 transition-colors", passwordRules.length ? "text-emerald-600" : "text-muted-foreground")}>
                {passwordRules.length ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 8+ characters
              </div>
              <div className={cn("text-xs flex items-center gap-1.5 transition-colors", passwordRules.upper ? "text-emerald-600" : "text-muted-foreground")}>
                {passwordRules.upper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 1 uppercase
              </div>
              <div className={cn("text-xs flex items-center gap-1.5 transition-colors", passwordRules.number ? "text-emerald-600" : "text-muted-foreground")}>
                {passwordRules.number ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 1 number
              </div>
              <div className={cn("text-xs flex items-center gap-1.5 transition-colors", passwordRules.special ? "text-emerald-600" : "text-muted-foreground")}>
                {passwordRules.special ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 opacity-50" />} 1 special char
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="confirm" type={showConfirm ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={cn("pl-10 pr-10 h-12 transition-colors", confirmPassword.length > 0 && !passwordsMatch ? "border-destructive focus-visible:ring-destructive" : "", passwordsMatch ? "border-emerald-500 focus-visible:ring-emerald-500" : "")} required />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-destructive mt-1 font-medium">Passwords do not match</p>
          )}
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading || !isPasswordValid || !passwordsMatch}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}