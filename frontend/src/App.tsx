import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { Loader } from './components/ui/Loader';
import { SocketInitializer } from './components/socket/SocketInitializer';
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
import WithdrawalPage from './pages/WithdrawalPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProfilePage from './pages/ProfilePage';

import MessagingPage from './pages/MessagingPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ConsultantProposalsPage from './pages/ConsultantProposalsPage';
import ConsultantProfileViewPage from './pages/ConsultantProfileViewPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import LogoutPage from './pages/LogoutPage';
import JobDetailWithMatchingPage from './pages/JobDetailWithMatchingPage';

const App = () => {
  return (
    <>
      <SocketInitializer />
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
        <Route path="/verify-identity" element={
          <ProtectedRoute>
            <VerifyIdentityPage />
          </ProtectedRoute>
        } />
        <Route path="/verification-pending" element={
          <ProtectedRoute>
            <VerificationPendingPage />
          </ProtectedRoute>
        } />
        <Route path="/buyer-dashboard" element={
          <ProtectedRoute requiredRole="buyer">
            <BuyerDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/consultant-dashboard" element={
          <ProtectedRoute requiredRole="consultant">
            <ConsultantDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/consultant-proposals" element={
          <ProtectedRoute requiredRole="consultant">
            <ConsultantProposalsPage />
          </ProtectedRoute>
        } />
        <Route path="/consultant/:consultantId" element={<ConsultantProfileViewPage />} />
        <Route path="/submit-proposal/:jobId" element={
          <ProtectedRoute requiredRole="consultant">
            <SubmitProposalPage />
          </ProtectedRoute>
        } />
        <Route path="/post-job" element={
          <ProtectedRoute requiredRole="buyer">
            <PostJobPage />
          </ProtectedRoute>
        } />
        <Route path="/post-job/:jobId" element={
          <ProtectedRoute requiredRole="buyer">
            <PostJobPage />
          </ProtectedRoute>
        } />
        <Route path="/job-detail/:jobId" element={
          <ProtectedRoute requiredRole="buyer">
            <JobDetailWithMatchingPage />
          </ProtectedRoute>
        } />
        <Route path="/payment" element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <MessagingPage />
          </ProtectedRoute>
        } />
        <Route path="/messages/:userId" element={
          <ProtectedRoute>
            <MessagingPage />
          </ProtectedRoute>
        } />
        <Route path="/withdrawal" element={
          <ProtectedRoute>
            <WithdrawalPage />
          </ProtectedRoute>
        } />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
