import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoleStore, AppRole } from "@/hooks/useRoleStore";
import { toast } from "sonner";
import { RotateCcw, Shield, UserCheck, User } from "lucide-react";

const roles: { id: AppRole; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'user', label: 'User', description: 'Regular users who can upload and view data', icon: User },
  { id: 'approver', label: 'Approver', description: 'Can approve or reject data submissions', icon: UserCheck },
  { id: 'sys_admin', label: 'Sys Admin', description: 'Full platform access except user & role management', icon: Shield },
  { id: 'role_admin', label: 'Role Admin', description: 'Manages users, roles, and login details', icon: Shield },
  { id: 'super_admin', label: 'Super Admin', description: 'Combines Sys Admin and Role Admin: full platform + user/role management', icon: Shield },
];

const RoleManagement = () => {
  const { pagePermissions, updatePagePermission, resetToDefaults } = useRoleStore();

  const handleRoleToggle = (pageId: string, role: AppRole, currentRoles: AppRole[]) => {
    let newRoles: AppRole[];
    
    if (currentRoles.includes(role)) {
      // Remove role
      newRoles = currentRoles.filter((r) => r !== role);
    } else {
      // Add role
      newRoles = [...currentRoles, role];
    }

    updatePagePermission(pageId, newRoles);
    toast.success(`Page permissions updated`);
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    toast.success("Permissions reset to defaults");
  };

  return (
    <div className="space-y-6">
      {/* Role Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent className="p-4 flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <role.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold capitalize">{role.label}</h3>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Page Permissions Matrix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Page Visibility</CardTitle>
            <CardDescription>
              Configure which pages each role can access
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleResetDefaults} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Page</TableHead>
                <TableHead className="w-[150px]">Path</TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <role.icon className="w-4 h-4" />
                      <span className="capitalize">{role.label}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagePermissions.map((page) => (
                <TableRow key={page.pageId}>
                  <TableCell className="font-medium">{page.pageName}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{page.path}</code>
                  </TableCell>
                  {roles.map((role) => (
                    <TableCell key={role.id} className="text-center">
                      <Checkbox
                        checked={page.roles.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(page.pageId, role.id, page.roles)}
                        disabled={page.pageId === 'access' && role.id === 'super_admin'} // Super Admin always retains Access
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Current Permissions Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Summary</CardTitle>
          <CardDescription>
            Overview of pages accessible by each role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {roles.map((role) => {
              const accessiblePages = pagePermissions.filter((p) => p.roles.includes(role.id));
              return (
                <div key={role.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mb-3">
                    <role.icon className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold capitalize">{role.label}</h4>
                    <Badge variant="secondary" className="ml-auto">
                      {accessiblePages.length} pages
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {accessiblePages.map((page) => (
                      <Badge key={page.pageId} variant="outline" className="text-xs">
                        {page.pageName}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;
