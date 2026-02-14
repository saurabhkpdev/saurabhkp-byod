import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'approver' | 'user';

export interface User {
  id: string;
  username: string;
  password: string; // Now stores bcrypt hash
  role: UserRole;
  createdAt: string;
}

interface AuthState {
  currentUser: Omit<User, 'password'> | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setCurrentUser: (user: Omit<User, 'password'> | null) => void;
  addUser: (username: string, password: string, role: UserRole) => boolean;
  updateUser: (id: string, updates: Partial<Pick<User, 'username' | 'password' | 'role'>>) => boolean;
  deleteUser: (id: string) => boolean;
  isAuthenticated: () => boolean;
}

// Pre-computed bcrypt hash for 'admin' (cost factor 10)
const DEFAULT_ADMIN_HASH = bcrypt.hashSync('admin', 10);

const defaultUsers: User[] = [
  {
    id: 'default-admin',
    username: 'admin',
    password: DEFAULT_ADMIN_HASH,
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

// Helper to check if a stored password is already hashed
const isHashed = (password: string) => password.startsWith('$2a$') || password.startsWith('$2b$');

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: defaultUsers,

      login: (username: string, password: string) => {
        const { users } = get();
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        
        if (user) {
          // Support both hashed and legacy plaintext passwords (auto-migrate)
          const matches = isHashed(user.password)
            ? bcrypt.compareSync(password, user.password)
            : user.password === password;

          if (matches) {
            // Auto-migrate plaintext password to hash on successful login
            if (!isHashed(user.password)) {
              const hashedPassword = bcrypt.hashSync(password, 10);
              const updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, password: hashedPassword } : u
              );
              set({ users: updatedUsers });
            }

            const { password: _, ...userWithoutPassword } = user;
            set({ currentUser: userWithoutPassword });
            return true;
          }
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
        supabase.auth.signOut();
      },

      setCurrentUser: (user: Omit<User, 'password'> | null) => {
        set({ currentUser: user });
      },

      addUser: (username: string, password: string, role: UserRole) => {
        const { users } = get();
        
        if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          return false;
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser: User = {
          id: crypto.randomUUID(),
          username,
          password: hashedPassword,
          role,
          createdAt: new Date().toISOString(),
        };

        set({ users: [...users, newUser] });
        return true;
      },

      updateUser: (id: string, updates: Partial<Pick<User, 'username' | 'password' | 'role'>>) => {
        const { users, currentUser } = get();
        
        if (updates.username) {
          const conflict = users.find(
            (u) => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase()
          );
          if (conflict) return false;
        }

        // Hash the password if it's being updated
        const processedUpdates = { ...updates };
        if (processedUpdates.password) {
          processedUpdates.password = bcrypt.hashSync(processedUpdates.password, 10);
        }

        const updatedUsers = users.map((user) =>
          user.id === id ? { ...user, ...processedUpdates } : user
        );

        set({ users: updatedUsers });

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
        
        const user = users.find((u) => u.id === id);
        if (user?.role === 'admin') {
          const adminCount = users.filter((u) => u.role === 'admin').length;
          if (adminCount <= 1) return false;
        }

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
