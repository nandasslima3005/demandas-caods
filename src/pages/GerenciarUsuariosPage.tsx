import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Shield } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function GerenciarUsuariosPage() {
  const [role, setRole] = useState<string>('');
  const [newRole, setNewRole] = useState<'gestor' | 'requisitante'>('gestor');
  const [emails, setEmails] = useState<string[]>([]);
  const [delEmail, setDelEmail] = useState<string>('');

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
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata ?? {};
      setRole((meta.role as string) ?? '');
      const { data: profiles } = await supabase.from('profiles').select('email').order('email');
      setEmails((profiles ?? []).map((p: { email: string }) => p.email));
    };
    load();
  }, []);

  if (role !== 'gestor') {
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
              <Label>Nome Completo</Label>
              <Input id="new-name" placeholder="Nome Completo" />
            </div>
            <div className="space-y-2">
              <Label>E-mail Institucional</Label>
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
              <Label>Senha</Label>
              <Input id="new-password" type="password" placeholder="Senha temporária" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button className="gradient-primary border-0" onClick={async () => {
              const name = (document.getElementById('new-name') as HTMLInputElement)?.value || '';
              const email = (document.getElementById('new-email') as HTMLInputElement)?.value || '';
              const phone = (document.getElementById('new-phone') as HTMLInputElement)?.value || '';
              const orgao = (document.getElementById('new-orgao') as HTMLInputElement)?.value || '';
              const password = (document.getElementById('new-password') as HTMLInputElement)?.value || '';
              if (!email || !password) { toast({ title: 'Preencha e-mail e senha', variant: 'destructive' }); return; }
              const { error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone, orgao, role: newRole } } });
              if (error) { toast({ title: 'Falha ao cadastrar', description: 'Verifique os dados.', variant: 'destructive' }); return; }
              try { await supabase.from('profiles').insert({ name, email, phone, orgao, role: newRole }); } catch { /* ignore */ }
              setEmails((prev) => Array.from(new Set([...prev, email])));
              toast({ title: 'Usuário cadastrado', description: 'E-mail de confirmação enviado.' });
            }}>
              <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Usuário
            </Button>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>E-mail para excluir</Label>
              <Select value={delEmail} onValueChange={(v) => setDelEmail(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o e-mail" />
                </SelectTrigger>
                <SelectContent>
                  {emails.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="destructive" onClick={async () => {
              if (!delEmail) { toast({ title: 'Informe o e-mail', variant: 'destructive' }); return; }
              try { await supabase.from('profiles').delete().eq('email', delEmail); setEmails((prev) => prev.filter((e) => e !== delEmail)); toast({ title: 'Perfil removido', description: 'Remoção da conta de autenticação requer chave de serviço.' }); }
              catch { toast({ title: 'Falha ao remover', variant: 'destructive' }); }
            }}>Excluir Usuário</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
