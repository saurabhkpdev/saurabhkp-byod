import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppRole = 'user' | 'approver' | 'sys_admin' | 'role_admin';

export interface PagePermission {
  pageId: string;
  pageName: string;
  path: string;
  roles: AppRole[];
}

interface RoleState {
  // Default page permissions
  pagePermissions: PagePermission[];
  
  // Get pages visible to a role
  getVisiblePages: (role: AppRole) => PagePermission[];
  
  // Check if a role can access a page
  canAccessPage: (role: AppRole, path: string) => boolean;
  
  // Update page visibility for a role
  updatePagePermission: (pageId: string, roles: AppRole[]) => void;
  
  // Reset to defaults
  resetToDefaults: () => void;
}

const defaultPagePermissions: PagePermission[] = [
  { pageId: 'home', pageName: 'Home', path: '/', roles: ['user', 'approver', 'sys_admin', 'role_admin'] },
  { pageId: 'data-studio', pageName: 'Data Studio', path: '/upload', roles: ['user', 'approver', 'sys_admin'] },
  { pageId: 'templates', pageName: 'Templates', path: '/templates', roles: ['user', 'approver', 'sys_admin'] },
  { pageId: 'datasets', pageName: 'Datasets', path: '/datasets', roles: ['user', 'approver', 'sys_admin'] },
  { pageId: 'actions', pageName: 'Actions', path: '/actions', roles: ['sys_admin'] },
  { pageId: 'documentation', pageName: 'Documentation', path: '/docs', roles: ['user', 'approver', 'sys_admin', 'role_admin'] },
  { pageId: 'approvals', pageName: 'Approvals', path: '/approvals', roles: ['approver', 'sys_admin'] },
  { pageId: 'admin', pageName: 'Admin', path: '/admin', roles: ['sys_admin', 'role_admin'] },
];

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      pagePermissions: defaultPagePermissions,

      getVisiblePages: (role: AppRole) => {
        return get().pagePermissions.filter((page) => page.roles.includes(role));
      },

      canAccessPage: (role: AppRole, path: string) => {
        const page = get().pagePermissions.find((p) => p.path === path);
        if (!page) return true; // Allow access to unlisted pages
        return page.roles.includes(role);
      },

      updatePagePermission: (pageId: string, roles: AppRole[]) => {
        set((state) => ({
          pagePermissions: state.pagePermissions.map((page) =>
            page.pageId === pageId ? { ...page, roles } : page
          ),
        }));
      },

      resetToDefaults: () => {
        set({ pagePermissions: defaultPagePermissions });
      },
    }),
    {
      name: 'role-storage',
    }
  )
);
