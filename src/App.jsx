import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LanguageProvider } from '@/lib/LanguageContext';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import Programmes from '@/pages/Programmes';
import ProgrammeDetails from '@/pages/ProgrammeDetails';
import ProgrammeCreate from '@/pages/ProgrammeCreate';
import Applications from '@/pages/Applications';
import UserManagement from '@/pages/UserManagement';
import Rubrics from '@/pages/Rubrics';
import Grants from '@/pages/Grants';
import Alumni from '@/pages/Alumni';
import Calibration from '@/pages/Calibration';
import Analytics from '@/pages/Analytics';
import Messages from '@/pages/Messages';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import Reviews from '@/pages/Reviews';
import ReviewHistory from '@/pages/ReviewHistory';
import MyApplications from '@/pages/MyApplications';
import ImpactReports from '@/pages/ImpactReports';
import Milestones from '@/pages/Milestones';
import Pricing from '@/pages/Pricing';
import BudgetManagement from '@/pages/BudgetManagement';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold">NX</span>
          </div>
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/programmes" element={<Programmes />} />
          <Route path="/programmes/create" element={<ProgrammeCreate />} />
          <Route path="/programmes/:id" element={<ProgrammeDetails />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/rubrics" element={<Rubrics />} />
          <Route path="/grants" element={<Grants />} />
          <Route path="/alumni" element={<Alumni />} />
          <Route path="/calibration" element={<Calibration />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/review-history" element={<ReviewHistory />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/impact-reports" element={<ImpactReports />} />
          <Route path="/milestones" element={<Milestones />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/budget" element={<BudgetManagement />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <SonnerToaster position="top-right" richColors />
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App