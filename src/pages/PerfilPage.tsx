import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building2, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function PerfilPage() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', orgao: '' });
  const [role, setRole] = useState('');
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<'inactive' | 'active' | 'enrolling'>('inactive');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const issuer = useMemo(() => 'CAODS', []);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const meta = auth.user?.user_metadata ?? {};
      const base = {
        name: (meta.name as string) ?? '',
        email: auth.user?.email ?? '',
        phone: (meta.phone as string) ?? '',
        orgao: (meta.orgao as string) ?? '',
      };
      setRole((meta.role as string) ?? '');

      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', base.email)
          .limit(1)
          .single();
        if (data) {
          setProfile({
            name: data.name ?? base.name,
            email: data.email ?? base.email,
            phone: data.phone ?? base.phone,
            orgao: data.orgao ?? base.orgao,
          });
          const computedRole = (data.role as string) ?? ((meta.role as string) ?? '');
          setRole(computedRole);
        } else {
          setProfile(base);
        }
      } catch {
        setProfile(base);
        void 0;
      }
    };
    load();
  }, []);

  type MfaFactor = { id: string; factor_type: 'totp' | 'webauthn' | 'sms' | string; status: 'verified' | 'unverified' | 'active' | 'inactive' | string };
  const loadMfa = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return;
    const all = (data?.all ?? []) as MfaFactor[];
    const totp = (data?.totp as MfaFactor[] | undefined) ?? all.filter((f) => f.factor_type === 'totp');
    const active = totp.find((f) => f.status === 'verified' || f.status === 'active');
    if (active) {
      setMfaStatus('active');
      setMfaFactorId(active.id);
      setMfaSecret(null);
      setMfaCode('');
    } else {
      setMfaStatus('inactive');
      setMfaFactorId(null);
      setMfaSecret(null);
      setMfaCode('');
    }
  };

  const save = async () => {
    try {
      await supabase.auth.updateUser({ data: { name: profile.name, phone: profile.phone, orgao: profile.orgao, role } });
    } catch {
      void 0;
    }
    try {
      const { data } = await supabase.from('profiles').select('id').eq('email', profile.email).limit(1).single();
      if (data?.id) {
        await supabase.from('profiles').update({ name: profile.name, email: profile.email, phone: profile.phone, orgao: profile.orgao, updated_at: new Date().toISOString() }).eq('id', data.id);
      } else {
        await supabase.from('profiles').insert({ name: profile.name, email: profile.email, phone: profile.phone, orgao: profile.orgao, role });
      }
      toast({ title: 'Perfil atualizado' });
    } catch {
      toast({ title: 'Perfil atualizado', description: 'Dados salvos apenas na conta de autenticação.' });
      void 0;
    }
  };

  const changePassword = async () => {
    if (!profile.email || !pwdCurrent || !pwdNew || !pwdConfirm) { toast({ title: 'Preencha os campos', variant: 'destructive' }); return; }
    if (pwdNew !== pwdConfirm) { toast({ title: 'Senhas não conferem', variant: 'destructive' }); return; }
    setPwdLoading(true);
    const { error: signError } = await supabase.auth.signInWithPassword({ email: profile.email, password: pwdCurrent });
    if (signError) { setPwdLoading(false); toast({ title: 'Senha atual incorreta', variant: 'destructive' }); return; }
    const { error } = await supabase.auth.updateUser({ password: pwdNew });
    setPwdLoading(false);
    if (error) { toast({ title: 'Erro ao alterar senha', variant: 'destructive' }); return; }
    setPwdCurrent('');
    setPwdNew('');
    setPwdConfirm('');
    toast({ title: 'Senha alterada com sucesso' });
  };

  const startEnrollMfa = async () => {
    setMfaLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    setMfaLoading(false);
    if (error) { toast({ title: 'Erro ao iniciar 2FA', variant: 'destructive' }); return; }
    const enrollData = data as { id: string; type: 'totp'; secret: string } | null;
    if (!enrollData) { toast({ title: 'Erro ao iniciar 2FA', variant: 'destructive' }); return; }
    setMfaSecret(enrollData.secret);
    setMfaFactorId(enrollData.id);
    setMfaStatus('enrolling');
  };

  const verifyEnrollMfa = async () => {
    if (!mfaFactorId || !mfaCode || mfaCode.length < 6) { toast({ title: 'Informe o código 2FA', variant: 'destructive' }); return; }
    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, code: mfaCode });
    setMfaLoading(false);
    if (error) { toast({ title: 'Código inválido', variant: 'destructive' }); return; }
    setMfaStatus('active');
    setMfaSecret(null);
    setMfaCode('');
    toast({ title: '2FA ativada' });
  };

  const disableMfa = async () => {
    if (!mfaFactorId) return;
    setMfaLoading(true);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    setMfaLoading(false);
    if (error) { toast({ title: 'Erro ao desativar 2FA', variant: 'destructive' }); return; }
    setMfaStatus('inactive');
    setMfaFactorId(null);
    setMfaSecret(null);
    setMfaCode('');
    toast({ title: '2FA desativada' });
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
                {(profile.name || '').split(' ').filter(Boolean).map(p => p[0]).slice(0,2).join('').toUpperCase() || 'U'}
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold font-display">{profile.name || profile.email}</h2>
              <p className="text-muted-foreground">{role === 'gestor' ? 'Gestor' : 'Usuário'}</p>
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Alterar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                  <DialogDescription>Informe sua senha atual e a nova senha.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Senha atual</Label>
                    <Input type="password" value={pwdCurrent} onChange={(e) => setPwdCurrent(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nova senha</Label>
                    <Input type="password" value={pwdNew} onChange={(e) => setPwdNew(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar nova senha</Label>
                    <Input type="password" value={pwdConfirm} onChange={(e) => setPwdConfirm(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancelar</Button>
                  <Button className="gradient-primary border-0" onClick={changePassword} disabled={pwdLoading}>
                    {pwdLoading ? 'Salvando...' : 'Salvar' }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium">Autenticação em Duas Etapas</p>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança
              </p>
            </div>
            <Dialog onOpenChange={(o) => { setMfaOpen(o); if (o) loadMfa(); }} open={mfaOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Configurar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Autenticação em Duas Etapas</DialogTitle>
                  <DialogDescription>Configure códigos TOTP no seu autenticador.</DialogDescription>
                </DialogHeader>
                {mfaStatus === 'active' && (
                  <div className="space-y-3">
                    <p className="text-sm">2FA está ativada nesta conta.</p>
                    <div className="flex justify-end">
                      <Button variant="destructive" onClick={disableMfa} disabled={mfaLoading}>
                        {mfaLoading ? 'Desativando...' : 'Desativar 2FA'}
                      </Button>
                    </div>
                  </div>
                )}
                {mfaStatus === 'inactive' && (
                  <div className="space-y-3">
                    <p className="text-sm">2FA está desativada.</p>
                    <div className="flex justify-end">
                      <Button onClick={startEnrollMfa} disabled={mfaLoading}>
                        {mfaLoading ? 'Iniciando...' : 'Ativar 2FA'}
                      </Button>
                    </div>
                  </div>
                )}
                {mfaStatus === 'enrolling' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm">Adicione manualmente no autenticador usando o segredo:</p>
                      <p className="font-mono text-sm mt-1">{mfaSecret}</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Digite o código de 6 dígitos</Label>
                      <InputOTP maxLength={6} value={mfaCode} onChange={(value) => setMfaCode(value)}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => { setMfaStatus('inactive'); setMfaSecret(null); setMfaCode(''); }}>Cancelar</Button>
                      <Button className="gradient-primary border-0" onClick={verifyEnrollMfa} disabled={mfaLoading}>
                        {mfaLoading ? 'Verificando...' : 'Confirmar'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Gestão de usuários movida para página dedicada */}
    </div>
  );
}
