import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '../redux/store';
import { clearUser, validateToken } from '../redux/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  const logout = useCallback(() => {
    dispatch(clearUser());
  }, [dispatch]);

  const checkTokenValidity = useCallback(() => {
    dispatch(validateToken());
  }, [dispatch]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    logout,
    checkTokenValidity,
  };
};