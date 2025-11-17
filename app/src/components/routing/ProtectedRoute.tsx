import { ReactNode } from 'react';
import LoadingState from '../common/LoadingState';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingState label="Checking authentication…" />;
  }

  if (status !== 'authenticated') {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
