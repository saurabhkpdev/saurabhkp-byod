import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Shield, User as UserIcon, UserCheck, Loader2 } from "lucide-react";

interface UserWithRoles {
  id: string;
  username: string;
  roles: UserRole[];
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_login_user_agent: string | null;
}

const allRoles: { value: UserRole; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'approver', label: 'Approver' },
  { value: 'admin', label: 'Admin' },
];

const summarizeUserAgent = (ua: string): string => {
  const u = ua.toLowerCase();
  let browser = 'Unknown browser';
  if (u.includes('edg/')) browser = 'Edge';
  else if (u.includes('chrome/') && !u.includes('chromium')) browser = 'Chrome';
  else if (u.includes('firefox/')) browser = 'Firefox';
  else if (u.includes('safari/') && !u.includes('chrome')) browser = 'Safari';
  else if (u.includes('opr/') || u.includes('opera')) browser = 'Opera';

  let os = 'Unknown OS';
  if (u.includes('windows')) os = 'Windows';
  else if (u.includes('mac os') || u.includes('macos')) os = 'macOS';
  else if (u.includes('android')) os = 'Android';
  else if (u.includes('iphone') || u.includes('ipad') || u.includes('ios')) os = 'iOS';
  else if (u.includes('linux')) os = 'Linux';

  return `${browser} · ${os}`;
};

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [formRoles, setFormRoles] = useState<UserRole[]>(['user']);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, created_at, last_login_at, last_login_ip, last_login_user_agent');

      if (profilesError) throw profilesError;

      // Fetch all roles (admin can see all via RLS)
      const { data: roleRows, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles: UserWithRoles[] = (profiles || []).map((p: any) => ({
        id: p.id,
        username: p.username || 'Unknown',
        created_at: p.created_at,
        last_login_at: p.last_login_at ?? null,
        last_login_ip: p.last_login_ip ?? null,
        last_login_user_agent: p.last_login_user_agent ?? null,
        roles: (roleRows || [])
          .filter((r: any) => r.user_id === p.id)
          .map((r: any) => r.role as UserRole),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Failed to load users", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = (role: UserRole) => {
    setFormRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleUpdateRoles = async () => {
    if (!editingUser) return;
    if (formRoles.length === 0) {
      toast.error("Select at least one role");
      return;
    }

    try {
      // Delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id);

      if (deleteError) throw deleteError;

      // Insert new roles
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(formRoles.map(role => ({ user_id: editingUser.id, role })));

      if (insertError) throw insertError;

      toast.success("User roles updated");
      setIsEditDialogOpen(false);
      setEditingUser(null);

      // Refresh user list and current user if editing self
      fetchUsers();
      if (editingUser.id === currentUser?.id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          useAuth.getState().fetchUserProfile(user);
        }
      }
    } catch (error: any) {
      toast.error("Failed to update roles", { description: error.message });
    }
  };

  const openEditDialog = (user: UserWithRoles) => {
    setEditingUser(user);
    setFormRoles(user.roles.length > 0 ? [...user.roles] : ['user']);
    setIsEditDialogOpen(true);
  };

  const getRoleIcon = (roles: UserRole[]) => {
    if (roles.includes('admin')) return <Shield className="h-4 w-4 text-primary" />;
    if (roles.includes('approver')) return <UserCheck className="h-4 w-4 text-green-600" />;
    return <UserIcon className="h-4 w-4 text-muted-foreground" />;
  };

  const RoleCheckboxes = () => (
    <div className="flex flex-wrap gap-4">
      {allRoles.map((role) => (
        <label key={role.value} className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={formRoles.includes(role.value)}
            onCheckedChange={() => toggleRole(role.value)}
          />
          <span className="text-sm">{role.label}</span>
        </label>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user roles and permissions (users register via sign-up)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.roles)}
                      {user.username}
                      {user.id === currentUser?.id && (
                        <Badge variant="secondary" className="text-xs">You</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(user.roles.length > 0 ? user.roles : ['user']).map((role) => (
                        <Badge
                          key={role}
                          variant={role === "admin" ? "default" : role === "approver" ? "outline" : "secondary"}
                        >
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Roles Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Roles for {editingUser?.username}</DialogTitle>
            <DialogDescription>Select the roles this user should have</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-3 block">Roles</Label>
            <RoleCheckboxes />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRoles}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
