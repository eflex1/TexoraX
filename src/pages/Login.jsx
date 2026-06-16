import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Building2, ClipboardCheck, Wallet, UserCircle, ChevronLeft } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import { useLanguage, LANGUAGES } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

const PORTALS = [
  {
    role: 'admin',
    key: 'portal_admin',
    descKey: 'portal_admin_desc',
    icon: Building2,
    color: 'from-violet-600 to-indigo-700',
    bg: 'bg-violet-50 border-violet-200 hover:border-violet-400',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    role: 'reviewer',
    key: 'portal_reviewer',
    descKey: 'portal_reviewer_desc',
    icon: ClipboardCheck,
    color: 'from-sky-500 to-blue-700',
    bg: 'bg-sky-50 border-sky-200 hover:border-sky-400',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    role: 'donor',
    key: 'portal_donor',
    descKey: 'portal_donor_desc',
    icon: Wallet,
    color: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-50 border-amber-200 hover:border-amber-400',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    role: 'applicant',
    key: 'portal_applicant',
    descKey: 'portal_applicant_desc',
    icon: UserCircle,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 border-emerald-200 hover:border-emerald-400',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
];

export default function Login() {
  const { t, lang, setLang } = useLanguage();
  const { login } = useAuth(); 
  const navigate = useNavigate();
  
  const [selectedPortal, setSelectedPortal] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const portal = PORTALS.find(p => p.role === selectedPortal);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, selectedPortal);
      navigate("/");
    } catch (err) {
      // FIX: Extract the beautiful custom error message from Node.js
      const actualErrorMessage = err.response?.data?.message || err.message || "Invalid email or password";
      setError(actualErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await login(`${selectedPortal}@texorax.com`, "google-auth", selectedPortal);
      navigate("/");
    } catch (err) {
      const actualErrorMessage = err.response?.data?.message || err.message || "Google authentication failed";
      setError(actualErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      {/* Language picker */}
      <div className="absolute top-4 right-4 flex items-center gap-1">
        {LANGUAGES.map(l => (
          <button key={l.code} onClick={() => setLang(l.code)}
            className={cn("text-xs px-2 py-1 rounded-lg font-medium transition-all", lang === l.code ? "bg-primary text-white" : "bg-white text-gray-500 border hover:border-primary/50")}>
            {l.flag} {l.code.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="https://media.base44.com/images/public/6a1461e7a37eb199f332e347/f5a498f57_IMG_9423.png"
            alt="NexoraX"
            className="h-10 mx-auto object-contain mb-3"
          />
          <h1 className="text-2xl font-bold text-gray-900">{t('welcome_back')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('login_subtitle')}</p>
        </div>

        {!selectedPortal ? (
          /* Portal selector */
          <div className="grid grid-cols-2 gap-3">
            {PORTALS.map(p => {
              const Icon = p.icon;
              return (
                <button key={p.role} onClick={() => setSelectedPortal(p.role)}
                  className={cn("flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all text-left", p.bg)}>
                  <div className={cn("p-3 rounded-xl", p.iconBg)}>
                    <Icon className={cn("h-6 w-6", p.iconColor)} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm text-gray-900">{t(p.key)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t(p.descKey)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* Login form */
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <button onClick={() => { setSelectedPortal(null); setError(''); }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
              <ChevronLeft className="h-4 w-4" /> {t('login_subtitle').split(' ')[0]}
            </button>

            <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r text-white mb-6", portal.color)}>
              <portal.icon className="h-5 w-5" />
              <div>
                <p className="text-xs opacity-80">{t('login_as')}</p>
                <p className="font-semibold text-sm">{t(portal.key)}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full h-11 text-sm font-medium mb-5" onClick={handleGoogle}>
              <GoogleIcon className="w-4 h-4 mr-2" />
              {t('continue_with_google')}
            </Button>

            <div className="relative mb-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground">{t('or')}</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex flex-col gap-2">
                <span>{error}</span>
                {/* If the error is about verification, give them a helpful link! */}
                {error.includes("verify") && (
                  <Link to={`/register?role=${selectedPortal}`} className="font-semibold underline hover:text-destructive/80">
                    Click here to register again and get a new code.
                  </Link>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('password')}</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t('forgot_password')}</Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('logging_in')}</> : t('log_in')}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              {t('no_account')}{' '}
              <Link to={`/register?role=${selectedPortal}`} className="text-primary font-medium hover:underline">{t('create_one')}</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}