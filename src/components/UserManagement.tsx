import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, ShieldAlert, Plus, Crown } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_blocked: boolean;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: perms }] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name'),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('user_permissions').select('user_id, can_add, can_edit, can_delete, is_blocked'),
    ]);

    const roleMap = new Map<string, 'admin' | 'user'>();
    roles?.forEach(r => roleMap.set(r.user_id, r.role as 'admin' | 'user'));

    const permMap = new Map<string, { can_add: boolean; can_edit: boolean; can_delete: boolean; is_blocked: boolean }>();
    perms?.forEach(p => permMap.set(p.user_id, p));

    const rows: UserRow[] = (profiles ?? []).map(p => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: roleMap.get(p.id) ?? 'user',
      can_add: permMap.get(p.id)?.can_add ?? false,
      can_edit: permMap.get(p.id)?.can_edit ?? false,
      can_delete: permMap.get(p.id)?.can_delete ?? false,
      is_blocked: permMap.get(p.id)?.is_blocked ?? false,
    }));

    setUsers(rows);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updatePermission = async (userId: string, field: string, value: boolean) => {
    const { error } = await supabase
      .from('user_permissions')
      .update({ [field]: value })
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to update permission');
      return;
    }

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, [field]: value } : u
    ));
    toast.success('Permission updated');
  };

  const toggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);

    if (error) {
      toast.error('Failed to update role');
      return;
    }

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: newRole } : u
    ));
    toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted to user'}`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const { error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: { data: { full_name: newFullName } },
    });

    setCreating(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('User created successfully');
    setCreateOpen(false);
    setNewEmail('');
    setNewPassword('');
    setNewFullName('');
    // Refresh after a short delay to let the trigger create profile/role/perms
    setTimeout(fetchUsers, 1500);
  };

  return (
    <>
      <Card className="border-primary/10 overflow-hidden">
        <CardHeader className="pb-0 px-6 pt-5 flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            User Management ({users.length})
          </CardTitle>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="rounded-xl gap-1.5">
            <Plus className="w-4 h-4" /> Create New User
          </Button>
        </CardHeader>
        <CardContent className="p-0 pt-4">
          {loading ? (
            <p className="text-center py-12 text-muted-foreground">Loading users...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-semibold">User</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold text-center">Add</TableHead>
                  <TableHead className="font-semibold text-center">Edit</TableHead>
                  <TableHead className="font-semibold text-center">Delete</TableHead>
                  <TableHead className="font-semibold text-center">Blocked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => {
                  const isAdmin = u.role === 'admin';
                  return (
                    <TableRow key={u.id} className={`border-b border-border/40 ${u.is_blocked ? 'opacity-50' : ''}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">
                            {u.full_name || u.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={isAdmin ? 'default' : 'secondary'}
                          size="sm"
                          className="rounded-lg text-xs gap-1 h-7"
                          onClick={() => toggleRole(u.id, u.role)}
                        >
                          {isAdmin && <Crown className="w-3 h-3" />}
                          {u.role}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isAdmin || u.can_add}
                          disabled={isAdmin}
                          onCheckedChange={(v) => updatePermission(u.id, 'can_add', !!v)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isAdmin || u.can_edit}
                          disabled={isAdmin}
                          onCheckedChange={(v) => updatePermission(u.id, 'can_edit', !!v)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isAdmin || u.can_delete}
                          disabled={isAdmin}
                          onCheckedChange={(v) => updatePermission(u.id, 'can_delete', !!v)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Switch
                            checked={u.is_blocked}
                            disabled={isAdmin}
                            onCheckedChange={(v) => updatePermission(u.id, 'is_blocked', v)}
                          />
                          {u.is_blocked && <ShieldAlert className="w-3.5 h-3.5 text-destructive" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-primary/20">
          <DialogHeader>
            <DialogTitle className="font-display">Create New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newFullName">Full Name</Label>
              <Input id="newFullName" value={newFullName} onChange={e => setNewFullName(e.target.value)}
                placeholder="John Doe" required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">Email</Label>
              <Input id="newEmail" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="user@example.com" required className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Password</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} className="rounded-xl" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={creating} className="rounded-xl">
                {creating ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserManagement;
