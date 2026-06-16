// src/lib/useCurrentUser.js
import { useAuth } from './AuthContext';

export function useCurrentUser() {
  const { user, isLoadingAuth } = useAuth();
  return { user, loading: isLoadingAuth };
}