import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'approver' | 'user';

export interface AppUser {
  id: string;
  username: string;
  roles: UserRole[];
  activeRole: UserRole;
  createdAt: string;
}

interface AuthState {
  currentUser: AppUser | null;
  session: Session | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setCurrentUser: (user: AppUser | null) => void;
  switchRole: (role: UserRole) => boolean;
  logout: () => Promise<void>;
  fetchUserProfile: (supabaseUser: SupabaseUser) => Promise<AppUser | null>;
}

export const useAuth = create<AuthState>()((set, get) => ({
  currentUser: null,
  session: null,
  loading: true,

  setSession: (session) => set({ session }),

  setCurrentUser: (user) => set({ currentUser: user }),

  switchRole: (role: UserRole) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    if (!currentUser.roles.includes(role)) return false;
    set({ currentUser: { ...currentUser, activeRole: role } });
    return true;
  },

  logout: async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('byod_wizard_consent');
    localStorage.removeItem('datalens-audit-log');
    set({ currentUser: null, session: null });
  },

  fetchUserProfile: async (supabaseUser: SupabaseUser): Promise<AppUser | null> => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', supabaseUser.id)
        .single();

      // Fetch roles
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', supabaseUser.id);

      const roles: UserRole[] = roleRows && roleRows.length > 0
        ? roleRows.map((r: any) => r.role as UserRole)
        : ['user'];

      const username = profile?.username
        || supabaseUser.user_metadata?.full_name
        || supabaseUser.user_metadata?.name
        || supabaseUser.email
        || 'User';

      const appUser: AppUser = {
        id: supabaseUser.id,
        username,
        roles,
        activeRole: roles[0],
        createdAt: supabaseUser.created_at,
      };

      // Preserve activeRole if user already had one selected
      const { currentUser } = get();
      const isFirstFetchThisSession = !currentUser || currentUser.id !== supabaseUser.id;
      if (currentUser?.id === supabaseUser.id && roles.includes(currentUser.activeRole)) {
        appUser.activeRole = currentUser.activeRole;
      }

      set({ currentUser: appUser, loading: false });

      // Stamp last login (fire-and-forget) — only on first profile fetch this session
      if (isFirstFetchThisSession) {
        supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', supabaseUser.id)
          .then(({ error }) => {
            if (error) console.warn('Failed to record last login:', error.message);
          });
      }

      return appUser;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ loading: false });
      return null;
    }
  },
}));
