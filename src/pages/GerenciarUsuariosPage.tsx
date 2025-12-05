import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Shield, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  orgao: string | null;
}

interface UserRole {
  user_id: string;
  role: 'gestor' | 'requisitante';
}

export default function GerenciarUsuariosPage() {
  const [currentRole, setCurrentRole] = useState<string>('');
  const [newRole, setNewRole] = useState<'gestor' | 'requisitante'>('requisitante');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [delUserId, setDelUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    const d1 = digits.slice(0, 2);
    const d2 = digits.slice(2, 7);
    const d3 = digits.slice(7, 11);
    let res = '';
    if (d1) res += '(' + d1 + ')';
    if (d2) res += ' ' + d2;
    if (d3) res += '-' + d3;
    return res;
  };

  useEffect(() => {
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const metaRole = (user.user_metadata?.role as string) ?? '';
      let role = metaRole;
      if (!role && user.email) {
        const { data: prof } = await supabase.from('profiles').select('role').eq('email', user.email).limit(1).maybeSingle();
        role = (prof?.role as string) ?? '';
      }
      setCurrentRole(role);
      if (role === 'gestor') {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .order('name');
        setProfiles((profilesData as Profile[]) ?? []);
      }
    };
    load();
  }, []);

  const handleCadastrar = async () => {
    const name = (document.getElementById('new-name') as HTMLInputElement)?.value?.trim() || '';
    const email = (document.getElementById('new-email') as HTMLInputElement)?.value?.trim() || '';
    const phone = (document.getElementById('new-phone') as HTMLInputElement)?.value || '';
    const orgao = (document.getElementById('new-orgao') as HTMLInputElement)?.value?.trim() || '';
    const password = (document.getElementById('new-password') as HTMLInputElement)?.value || '';

    if (!name || !email || !password) {
      toast({ title: 'Preencha nome, e-mail e senha', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, orgao, role: newRole },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast({ title: 'Falha ao cadastrar', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data.user) {
      try {
        await supabase.from('profiles').upsert({ name, email, phone, orgao, role: newRole }, { onConflict: 'email' });
      } catch { /* ignore */ }
      // Refresh profiles list
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      setProfiles((profilesData as Profile[]) ?? []);
      
      // Clear form
      (document.getElementById('new-name') as HTMLInputElement).value = '';
      (document.getElementById('new-email') as HTMLInputElement).value = '';
      (document.getElementById('new-phone') as HTMLInputElement).value = '';
      (document.getElementById('new-orgao') as HTMLInputElement).value = '';
      (document.getElementById('new-password') as HTMLInputElement).value = '';
      
      toast({ title: 'Usuário cadastrado com sucesso!' });
    }
    
    setLoading(false);
  };

  const handleExcluir = async () => {
    if (!delUserId) {
      toast({ title: 'Selecione um usuário', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('email', delUserId);
    if (error) {
      toast({ title: 'Falha ao remover', description: 'A remoção da conta de autenticação requer chave de serviço.', variant: 'destructive' });
    } else {
      setProfiles((prev) => prev.filter((p) => p.email !== delUserId));
      setDelUserId('');
      toast({ title: 'Perfil removido' });
    }
    setLoading(false);
  };

  if (currentRole !== 'gestor') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Acesso negado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Somente usuários com papel Gestor podem gerenciar usuários.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">Cadastrar e excluir usuários do sistema</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-lg">Cadastro de Usuários</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input id="new-name" placeholder="Nome Completo" />
            </div>
            <div className="space-y-2">
              <Label>E-mail Institucional *</Label>
              <Input id="new-email" type="email" placeholder="seuemail@mppi.mp.br" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input id="new-phone" placeholder="(xx) xxxxx-xxxx" onInput={(e) => { e.currentTarget.value = formatPhone(e.currentTarget.value); }} />
            </div>
            <div className="space-y-2">
              <Label>Órgão/Unidade</Label>
              <Input id="new-orgao" placeholder="Órgão/Unidade" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Perfil</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as 'gestor' | 'requisitante')}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="requisitante">Requisitante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input id="new-password" type="password" placeholder="Senha temporária" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="gradient-primary border-0" onClick={handleCadastrar} disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Usuário
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Excluir Usuário
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Selecione o usuário para excluir</Label>
                <Select value={delUserId} onValueChange={(v) => setDelUserId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.email} value={p.email}>
                        {p.name} ({p.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="destructive" onClick={handleExcluir} disabled={loading || !delUserId}>
                Excluir Usuário
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
