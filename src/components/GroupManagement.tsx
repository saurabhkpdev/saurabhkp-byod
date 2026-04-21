import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Users as UsersIcon, Loader2, UserPlus } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface GroupMember {
  group_id: string;
  user_id: string;
}

interface ProfileLite {
  id: string;
  username: string;
}

const GroupManagement = () => {
  const { currentUser } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const [membersOpen, setMembersOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [draftMemberIds, setDraftMemberIds] = useState<Set<string>>(new Set());

  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);

  const canManage =
    currentUser?.activeRole === "role_admin" ||
    currentUser?.activeRole === "super_admin";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [groupsRes, membersRes, profilesRes] = await Promise.all([
        supabase.from("groups").select("id, name, description, created_at").order("name"),
        supabase.from("group_members").select("group_id, user_id"),
        supabase.from("profiles").select("id, username").order("username"),
      ]);
      if (groupsRes.error) throw groupsRes.error;
      if (membersRes.error) throw membersRes.error;
      if (profilesRes.error) throw profilesRes.error;
      setGroups(groupsRes.data || []);
      setMembers(membersRes.data || []);
      setProfiles(
        (profilesRes.data || []).map((p: any) => ({
          id: p.id,
          username: p.username || "Unknown",
        }))
      );
    } catch (e: any) {
      toast.error(e.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const memberCount = (groupId: string) =>
    members.filter((m) => m.group_id === groupId).length;

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormDescription("");
    setEditOpen(true);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setFormName(g.name);
    setFormDescription(g.description || "");
    setEditOpen(true);
  };

  const saveGroup = async () => {
    if (!formName.trim()) {
      toast.error("Group name is required");
      return;
    }
    if (!currentUser) return;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("groups")
          .update({
            name: formName.trim(),
            description: formDescription.trim() || null,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Group updated");
      } else {
        const { error } = await supabase.from("groups").insert({
          name: formName.trim(),
          description: formDescription.trim() || null,
          created_by: currentUser.id,
        });
        if (error) throw error;
        toast.success("Group created");
      }
      setEditOpen(false);
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to save group");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase.from("groups").delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Group deleted");
      setDeleteTarget(null);
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete group");
    }
  };

  const openMembers = (g: Group) => {
    setActiveGroup(g);
    const current = new Set(
      members.filter((m) => m.group_id === g.id).map((m) => m.user_id)
    );
    setDraftMemberIds(current);
    setMembersOpen(true);
  };

  const toggleDraftMember = (userId: string) => {
    setDraftMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const saveMembers = async () => {
    if (!activeGroup || !currentUser) return;
    setSaving(true);
    try {
      const existing = new Set(
        members.filter((m) => m.group_id === activeGroup.id).map((m) => m.user_id)
      );
      const toAdd = [...draftMemberIds].filter((id) => !existing.has(id));
      const toRemove = [...existing].filter((id) => !draftMemberIds.has(id));

      if (toAdd.length) {
        const rows = toAdd.map((uid) => ({
          group_id: activeGroup.id,
          user_id: uid,
          added_by: currentUser.id,
        }));
        const { error } = await supabase.from("group_members").insert(rows);
        if (error) throw error;
      }
      if (toRemove.length) {
        const { error } = await supabase
          .from("group_members")
          .delete()
          .eq("group_id", activeGroup.id)
          .in("user_id", toRemove);
        if (error) throw error;
      }
      toast.success("Members updated");
      setMembersOpen(false);
      await fetchAll();
    } catch (e: any) {
      toast.error(e.message || "Failed to update members");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Groups
          </CardTitle>
          <CardDescription>
            Organize users into groups so templates and datasets can be shared with the right audience.
          </CardDescription>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No groups yet</p>
            <p className="text-sm">Create your first group to start organizing access.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Members</TableHead>
                <TableHead className="w-[180px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {g.description || <span className="italic">No description</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{memberCount(g.id)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openMembers(g)}
                        className="gap-1"
                        disabled={!canManage}
                      >
                        <UserPlus className="h-4 w-4" />
                        Members
                      </Button>
                      {canManage && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(g)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(g)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Create / Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Group" : "New Group"}</DialogTitle>
            <DialogDescription>
              Groups let you scope templates and datasets to a specific set of users.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="group-name">Name</Label>
              <Input
                id="group-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Marketing, Finance, Data Team"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-desc">Description</Label>
              <Textarea
                id="group-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveGroup} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Members — {activeGroup?.name}</DialogTitle>
            <DialogDescription>
              {canManage
                ? "Select the users that belong to this group."
                : "Members of this group."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-2">
              {profiles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No users found.
                </p>
              ) : (
                profiles.map((p) => {
                  const checked = draftMemberIds.has(p.id);
                  return (
                    <label
                      key={p.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => canManage && toggleDraftMember(p.id)}
                        disabled={!canManage}
                      />
                      <span className="text-sm">{p.username}</span>
                    </label>
                  );
                })
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersOpen(false)}>
              Close
            </Button>
            {canManage && (
              <Button onClick={saveMembers} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Members
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the group and all its memberships. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default GroupManagement;
