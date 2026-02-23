import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Users, ShieldAlert } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
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

  return (
    <Card className="border-primary/10 overflow-hidden">
      <CardHeader className="pb-0 px-6 pt-5">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          User Management ({users.length})
        </CardTitle>
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
                      <Badge variant={isAdmin ? 'default' : 'secondary'} className="rounded-lg text-xs">
                        {u.role}
                      </Badge>
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
  );
};

export default UserManagement;
