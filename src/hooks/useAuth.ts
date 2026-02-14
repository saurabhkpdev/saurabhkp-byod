import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import bcrypt from 'bcryptjs';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'approver' | 'user';

export interface User {
  id: string;
  username: string;
  password: string;
  roles: UserRole[];
  createdAt: string;
}

interface AuthState {
  currentUser: (Omit<User, 'password'> & { activeRole: UserRole }) | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  setCurrentUser: (user: (Omit<User, 'password'> & { activeRole: UserRole }) | null) => void;
  switchRole: (role: UserRole) => boolean;
  addUser: (username: string, password: string, roles: UserRole[]) => boolean;
  updateUser: (id: string, updates: Partial<Pick<User, 'username' | 'password' | 'roles'>>) => boolean;
  deleteUser: (id: string) => boolean;
  isAuthenticated: () => boolean;
}

const DEFAULT_ADMIN_HASH = bcrypt.hashSync('admin', 10);

const isHashed = (password: string) => password.startsWith('$2a$') || password.startsWith('$2b$');

const defaultUsers: User[] = [
  {
    id: 'default-admin',
    username: 'admin',
    password: DEFAULT_ADMIN_HASH,
    roles: ['admin', 'approver', 'user'],
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
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );

        if (user) {
          // Migrate legacy single-role users
          const userRoles: UserRole[] = (user as any).role
            ? [(user as any).role as UserRole]
            : user.roles || ['user'];

          const matches = isHashed(user.password)
            ? bcrypt.compareSync(password, user.password)
            : user.password === password;

          if (matches) {
            if (!isHashed(user.password)) {
              const hashedPassword = bcrypt.hashSync(password, 10);
              const updatedUsers = users.map((u) =>
                u.id === user.id ? { ...u, password: hashedPassword, roles: userRoles } : u
              );
              set({ users: updatedUsers });
            }

            const { password: _, ...userWithoutPassword } = { ...user, roles: userRoles };
            set({
              currentUser: {
                ...userWithoutPassword,
                activeRole: userRoles[0],
              },
            });
            return true;
          }
        }
        return false;
      },

      logout: () => {
        set({ currentUser: null });
        supabase.auth.signOut();
      },

      setCurrentUser: (user) => {
        set({ currentUser: user });
      },

      switchRole: (role: UserRole) => {
        const { currentUser } = get();
        if (!currentUser) return false;
        if (!currentUser.roles.includes(role)) return false;
        set({ currentUser: { ...currentUser, activeRole: role } });
        return true;
      },

      addUser: (username: string, password: string, roles: UserRole[]) => {
        const { users } = get();

        if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
          return false;
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newUser: User = {
          id: crypto.randomUUID(),
          username,
          password: hashedPassword,
          roles: roles.length > 0 ? roles : ['user'],
          createdAt: new Date().toISOString(),
        };

        set({ users: [...users, newUser] });
        return true;
      },

      updateUser: (id: string, updates: Partial<Pick<User, 'username' | 'password' | 'roles'>>) => {
        const { users, currentUser } = get();

        if (updates.username) {
          const conflict = users.find(
            (u) => u.id !== id && u.username.toLowerCase() === updates.username!.toLowerCase()
          );
          if (conflict) return false;
        }

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
            const newRoles = updates.roles || currentUser.roles;
            const activeRole = newRoles.includes(currentUser.activeRole)
              ? currentUser.activeRole
              : newRoles[0];
            set({
              currentUser: {
                ...userWithoutPassword,
                activeRole,
              },
            });
          }
        }

        return true;
      },

      deleteUser: (id: string) => {
        const { users, currentUser } = get();

        const user = users.find((u) => u.id === id);
        if (user?.roles?.includes('admin')) {
          const adminCount = users.filter((u) => u.roles?.includes('admin')).length;
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
