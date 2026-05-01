import { createContext, useContext, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSession,
  useLogin,
  useLogout,
  useRegisterUser,
  getGetSessionQueryKey,
  type User,
  type UserRole,
} from "@workspace/api-client-react";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetSession({
    query: {
      queryKey: getGetSessionQueryKey(),
      retry: false,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegisterUser();

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ data: { email, password } });
    await queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
    queryClient.setQueryData(getGetSessionQueryKey(), null);
    await queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => {
    await registerMutation.mutateAsync({ data });
    await queryClient.invalidateQueries({ queryKey: getGetSessionQueryKey() });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
