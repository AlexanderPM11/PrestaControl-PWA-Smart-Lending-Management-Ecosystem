import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

import LoansPage from './pages/LoansPage';
import NewLoanPage from './pages/NewLoanPage';
import LoanDetailsPage from './pages/LoanDetailsPage';
import EditLoanPage from './pages/EditLoanPage';
import PaymentsPage from './pages/PaymentsPage';
import DelinquentLoansPage from './pages/DelinquentLoansPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

import MainLayout from './components/layout/MainLayout';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? (
    <MainLayout>{children}</MainLayout>
  ) : (
    <Navigate to="/login" />
  );
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" /> : <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/loans" 
        element={
          <ProtectedRoute>
            <LoansPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/loans/new" 
        element={
          <ProtectedRoute>
            <NewLoanPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/loans/details/:id" 
        element={
          <ProtectedRoute>
            <LoanDetailsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/loans/edit/:id" 
        element={
          <ProtectedRoute>
            <EditLoanPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payments" 
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/loans/delinquent" 
        element={
          <ProtectedRoute>
            <DelinquentLoansPage />
          </ProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
