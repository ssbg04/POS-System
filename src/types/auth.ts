export type UserRole = "admin" | "pos";

export interface User {
  id?: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}
