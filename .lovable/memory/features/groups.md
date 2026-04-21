---
name: Groups
description: User groups for scoping template/dataset visibility, managed under Access
type: feature
---
- Tables: `public.groups` (name unique, description, created_by) and `public.group_members` (group_id, user_id, added_by). RLS: any authenticated user can SELECT both; only `role_admin` and `super_admin` can INSERT/UPDATE/DELETE.
- UI: `src/components/GroupManagement.tsx`, mounted as the "Groups" tab in `src/pages/Access.tsx`. Lets admins create/edit/delete groups and toggle members from the profiles list.
- `set_updated_at()` trigger maintains `groups.updated_at` (search_path pinned to public).
- Templates and datasets still live in localStorage; group-based sharing on those is not yet wired — requires migrating templates/datasets to the backend first.
