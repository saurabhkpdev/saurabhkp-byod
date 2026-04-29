import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, MonitorSmartphone, ShieldCheck, Users2 } from "lucide-react";
import UserManagement from "@/components/UserManagement";
import UserLoginDetails from "@/components/UserLoginDetails";
import RoleManagement from "@/components/RoleManagement";
import GroupManagement from "@/components/GroupManagement";

const Access = () => {
  return (
    <>
      <Helmet>
        <title>Access - BYD</title>
        <meta
          name="description"
          content="Manage users, roles, groups, and login details on the BYD platform."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Access</span> Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage users, role assignments, groups, and review user login activity
            </p>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <ShieldCheck className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-2">
                <Users2 className="h-4 w-4" />
                Groups
              </TabsTrigger>
              <TabsTrigger value="login-details" className="gap-2">
                <MonitorSmartphone className="h-4 w-4" />
                User Login Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            <TabsContent value="roles">
              <RoleManagement />
            </TabsContent>

            <TabsContent value="groups">
              <GroupManagement />
            </TabsContent>

            <TabsContent value="login-details">
              <UserLoginDetails />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Access;

