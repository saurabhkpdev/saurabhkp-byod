import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Activity } from "lucide-react";
import { toast } from "sonner";

interface UserLoginRow {
  id: string;
  username: string;
  created_at: string;
  last_login_at: string | null;
  last_login_ip: string | null;
  last_login_user_agent: string | null;
}

const summarizeUserAgent = (ua: string): string => {
  const u = ua.toLowerCase();
  let browser = "Unknown browser";
  if (u.includes("edg/")) browser = "Edge";
  else if (u.includes("chrome/") && !u.includes("chromium")) browser = "Chrome";
  else if (u.includes("firefox/")) browser = "Firefox";
  else if (u.includes("safari/") && !u.includes("chrome")) browser = "Safari";
  else if (u.includes("opr/") || u.includes("opera")) browser = "Opera";

  let os = "Unknown OS";
  if (u.includes("windows")) os = "Windows";
  else if (u.includes("mac os") || u.includes("macos")) os = "macOS";
  else if (u.includes("android")) os = "Android";
  else if (u.includes("iphone") || u.includes("ipad") || u.includes("ios")) os = "iOS";
  else if (u.includes("linux")) os = "Linux";

  return `${browser} · ${os}`;
};

const UserLoginDetails = () => {
  const { currentUser } = useAuth();
  const [rows, setRows] = useState<UserLoginRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, created_at, last_login_at, last_login_ip, last_login_user_agent")
          .order("last_login_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        setRows(
          (data || []).map((p: any) => ({
            id: p.id,
            username: p.username || "Unknown",
            created_at: p.created_at,
            last_login_at: p.last_login_at ?? null,
            last_login_ip: p.last_login_ip ?? null,
            last_login_user_agent: p.last_login_user_agent ?? null,
          })),
        );
      } catch (e: any) {
        toast.error("Failed to load login details", { description: e.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>User Login Details</CardTitle>
            <CardDescription>
              Operational sign-in metadata: last login time, IP address, and device
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {u.username}
                    {u.id === currentUser?.id && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {u.last_login_at
                    ? new Date(u.last_login_at).toLocaleString()
                    : <span className="italic">Never</span>}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {u.last_login_ip || <span className="italic font-sans">—</span>}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {u.last_login_user_agent ? (
                    <span title={u.last_login_user_agent} className="block max-w-[260px] truncate">
                      {summarizeUserAgent(u.last_login_user_agent)}
                    </span>
                  ) : (
                    <span className="italic">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserLoginDetails;
