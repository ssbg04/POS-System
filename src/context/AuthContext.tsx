import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import type { User, UserRole, AuthContextType } from "../types/auth";
import { USERS } from "../config/credentials"; // Import the array

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // 1. Initialize state from LocalStorage to prevent logout on refresh
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. Save to LocalStorage whenever user state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [user]);

  const login = (email: string, password: string) => {
    // 1. Find user in the generated list
    const foundUser = USERS.find(
      (u) => u.email === email && u.password === password
    );

    // 2. Authenticate
    if (foundUser) {
      const userData: User = {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role as UserRole,
        name: foundUser.name,
      };
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // LocalStorage cleanup is handled by the useEffect above
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
