import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { Loader } from './components/ui/Loader';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import SignupPage from './pages/SignupPage';
import AccountTypePage from './pages/AccountTypePage';
import VerifyIdentityPage from './pages/VerifyIdentityPage';
import VerificationPendingPage from './pages/VerificationPendingPage';
import BuyerDashboardPage from './pages/BuyerDashboardPage';
import ConsultantDashboardPage from './pages/ConsultantDashboardPage';
import SubmitProposalPage from './pages/SubmitProposalPage';
import PostJobPage from './pages/PostJobPage';
import PaymentPage from './pages/PaymentPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import MessagingPage from './pages/MessagingPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ConsultantProposalsPage from './pages/ConsultantProposalsPage';
import ConsultantProfileViewPage from './pages/ConsultantProfileViewPage';

const App = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/login" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/account-type" element={<AccountTypePage />} />
        <Route path="/verify-identity" element={<VerifyIdentityPage />} />
        <Route path="/verification-pending" element={<VerificationPendingPage />} />
        <Route path="/buyer-dashboard" element={<BuyerDashboardPage />} />
        <Route path="/consultant-dashboard" element={<ConsultantDashboardPage />} />
        <Route path="/consultant-proposals" element={<ConsultantProposalsPage />} />
        <Route path="/consultant/:consultantId" element={<ConsultantProfileViewPage />} />
        <Route path="/submit-proposal/:jobId" element={<SubmitProposalPage />} />
        <Route path="/post-job" element={<PostJobPage />} />
        <Route path="/post-job/:jobId" element={<PostJobPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/messages/:userId" element={<MessagingPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;


