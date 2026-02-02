import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: string;
}

interface AuthState {
  currentUser: Omit<User, 'password'> | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (username: string, password: string, role: 'admin' | 'user') => boolean;
  updateUser: (id: string, updates: Partial<Pick<User, 'username' | 'password' | 'role'>>) => boolean;
  deleteUser: (id: string) => boolean;
  isAuthenticated: () => boolean;
}

const defaultUsers: User[] = [
  {
    id: 'default-admin',
    username: 'admin',
    password: 'admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: defaultUsers,

      login: (username: string, password: string) => {
        const { users } = get();
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        );
        
        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          set({ currentUser: userWithoutPassword });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
      },

      addUser: (username: string, password: string, role: 'admin' | 'user') => {
        const { users } = get();
        
        // Check if username already exists
        if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          return false;
        }

        const newUser: User = {
          id: crypto.randomUUID(),
          username,
          password,
          role,
          createdAt: new Date().toISOString(),
        };

        set({ users: [...users, newUser] });
        return true;
      },

      updateUser: (id: string, updates: Partial<Pick<User, 'username' | 'password' | 'role'>>) => {
        const { users, currentUser } = get();
        
        // Check if new username conflicts with existing
        if (updates.username) {
          const conflict = users.find(
            (u) => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase()
          );
          if (conflict) return false;
        }

        const updatedUsers = users.map((user) =>
          user.id === id ? { ...user, ...updates } : user
        );

        set({ users: updatedUsers });

        // Update current user if they updated themselves
        if (currentUser?.id === id) {
          const updatedUser = updatedUsers.find((u) => u.id === id);
          if (updatedUser) {
            const { password: _, ...userWithoutPassword } = updatedUser;
            set({ currentUser: userWithoutPassword });
          }
        }

        return true;
      },

      deleteUser: (id: string) => {
        const { users, currentUser } = get();
        
        // Prevent deleting the last admin
        const user = users.find((u) => u.id === id);
        if (user?.role === 'admin') {
          const adminCount = users.filter((u) => u.role === 'admin').length;
          if (adminCount <= 1) return false;
        }

        // Prevent deleting yourself
        if (currentUser?.id === id) return false;

        set({ users: users.filter((u) => u.id !== id) });
        return true;
      },

      isAuthenticated: () => {
        return get().currentUser !== null;
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
