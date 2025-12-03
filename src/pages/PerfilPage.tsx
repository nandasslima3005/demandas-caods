import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export default function PerfilPage() {
  const [profile, setProfile] = useState({ name: 'Maria Silva', email: 'maria.silva@email.com', phone: '(86) 99999-9999', orgao: 'Promotoria de Justiça de Teresina' });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('profiles').select('*').limit(1).single();
      if (data) {
        setProfile({
          name: data.name,
          email: data.email,
          phone: data.phone ?? '',
          orgao: data.orgao ?? '',
        });
      }
    };
    load();
  }, []);

  const save = async () => {
    const { data } = await supabase.from('profiles').select('id').limit(1).single();
    if (data?.id) {
      await supabase.from('profiles').update({ name: profile.name, email: profile.email, phone: profile.phone, orgao: profile.orgao, updated_at: new Date().toISOString() }).eq('id', data.id);
    } else {
      await supabase.from('profiles').insert({ name: profile.name, email: profile.email, phone: profile.phone, orgao: profile.orgao });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      {/* Profile Card */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground font-display">
                MS
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold font-display">{profile.name}</h2>
              <p className="text-muted-foreground">Usuário Externo</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Conta verificada</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="nome" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="telefone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgao">Órgão/Unidade</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="orgao" value={profile.orgao} onChange={(e) => setProfile({ ...profile, orgao: e.target.value })} className="pl-9" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancelar</Button>
            <Button className="gradient-primary border-0" onClick={save}>Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Alterar Senha</p>
              <p className="text-sm text-muted-foreground">
                Última alteração há 30 dias
              </p>
            </div>
            <Button variant="outline">Alterar</Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Autenticação em Duas Etapas</p>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança
              </p>
            </div>
            <Button variant="outline">Configurar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
