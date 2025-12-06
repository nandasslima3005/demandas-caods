import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Building2, Shield, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import type { DbProfile } from '@/types/database';

export default function PerfilPage() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', orgao: '' });
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pwdLoading] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<'inactive' | 'active' | 'enrolling'>('inactive');
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      const meta = auth.user?.user_metadata ?? {};
      
      const base = {
        name: (meta.name as string) ?? '',
        email: auth.user?.email ?? '',
        phone: (meta.phone as string) ?? '',
        orgao: (meta.orgao as string) ?? '',
      };
      setAvatarUrl((meta.avatar_url as string) ?? null);

      if (userId) {
        // Get role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        setRole(roleData?.role ?? '');

        // Get profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (profileData) {
          const p = profileData as DbProfile;
          setProfile({
            name: p.name ?? base.name,
            email: p.email ?? base.email,
            phone: p.phone ?? base.phone,
            orgao: p.orgao ?? base.orgao,
          });
          if (p.avatar_url) setAvatarUrl(p.avatar_url);
        } else {
          setProfile(base);
        }
      } else {
        setProfile(base);
      }
    };
    load();
    return () => { };
  }, []);

  type MfaFactor = { id: string; factor_type: string; status: string };
  const loadMfa = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return;
    const all = (data?.all ?? []) as MfaFactor[];
    const totp = all.filter((f) => f.factor_type === 'totp');
    const active = totp.find((f) => f.status === 'verified' || f.status === 'active');
    if (active) {
      setMfaStatus('active');
      setMfaFactorId(active.id);
    } else {
      setMfaStatus('inactive');
      setMfaFactorId(null);
    }
    setMfaSecret(null);
    setMfaCode('');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      setAvatarUploading(false);
      toast({ title: 'Sessão expirada', variant: 'destructive' });
      return;
    }
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data: publicUrlData } = await supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = publicUrlData?.publicUrl ?? null;
      if (publicUrl) {
        await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
        await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
        setAvatarUrl(publicUrl);
        try { window.dispatchEvent(new CustomEvent('avatar:update', { detail: publicUrl })); } catch { void 0; }
        toast({ title: 'Avatar atualizado' });
      }
    }
    setAvatarUploading(false);
  };

  const save = async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    
    await supabase.auth.updateUser({ data: { name: profile.name, phone: profile.phone, orgao: profile.orgao } });
    
    if (userId) {
      await supabase.from('profiles').update({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        orgao: profile.orgao,
      }).eq('user_id', userId);
    }
    
    toast({ title: 'Perfil atualizado' });
  };

  const changePassword = async () => { return; };

  const startEnrollMfa = async () => {
    setMfaLoading(true);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    setMfaLoading(false);
    if (error || !data) {
      toast({ title: 'Erro ao iniciar 2FA', variant: 'destructive' });
      return;
    }
    const enrollData = data as any;
    setMfaSecret(enrollData.totp?.secret || enrollData.secret || null);
    setMfaFactorId(enrollData.id);
    setMfaStatus('enrolling');
  };

  const verifyEnrollMfa = async () => {
    if (!mfaFactorId || !mfaCode || mfaCode.length < 6) {
      toast({ title: 'Informe o código 2FA', variant: 'destructive' });
      return;
    }
    setMfaLoading(true);
    
    // First create a challenge
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
    if (challengeError || !challengeData) {
      setMfaLoading(false);
      toast({ title: 'Erro ao criar desafio', variant: 'destructive' });
      return;
    }
    
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challengeData.id,
      code: mfaCode,
    });
    setMfaLoading(false);
    if (error) {
      toast({ title: 'Código inválido', variant: 'destructive' });
      return;
    }
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
    if (error) {
      toast({ title: 'Erro ao desativar 2FA', variant: 'destructive' });
      return;
    }
    setMfaStatus('inactive');
    setMfaFactorId(null);
    setMfaSecret(null);
    setMfaCode('');
    toast({ title: '2FA desativada' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Meu Perfil
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative h-24 w-24 rounded-full overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-primary flex items-center justify-center">
                  <span className="text-3xl font-bold text-primary-foreground font-display">
                    {(profile.name || '').split(' ').filter(Boolean).map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'U'}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold font-display">{profile.name || profile.email}</h2>
              <p className="text-muted-foreground">{role === 'gestor' ? 'Gestor' : 'Usuário'}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Conta verificada</span>
              </div>
              <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                <input id="avatar-input" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <Button variant="outline" size="sm" onClick={() => document.getElementById('avatar-input')?.click()} disabled={avatarUploading}>
                  <Camera className="h-4 w-4 mr-2" />
                  {avatarUploading ? 'Enviando...' : 'Alterar Foto'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                <Input id="email" type="email" value={profile.email} disabled className="pl-9" />
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          

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
                    <Button variant="destructive" onClick={disableMfa} disabled={mfaLoading}>
                      {mfaLoading ? 'Desativando...' : 'Desativar 2FA'}
                    </Button>
                  </div>
                )}
                {mfaStatus === 'inactive' && (
                  <div className="space-y-3">
                    <p className="text-sm">2FA não está ativada.</p>
                    <Button onClick={startEnrollMfa} disabled={mfaLoading}>
                      {mfaLoading ? 'Iniciando...' : 'Ativar 2FA'}
                    </Button>
                  </div>
                )}
                {mfaStatus === 'enrolling' && mfaSecret && (
                  <div className="space-y-3">
                    <p className="text-sm">Adicione este segredo ao seu autenticador:</p>
                    <code className="block p-2 bg-muted rounded text-xs break-all">{mfaSecret}</code>
                    <div className="space-y-2">
                      <Label>Código de verificação</Label>
                      <InputOTP maxLength={6} value={mfaCode} onChange={setMfaCode}>
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
                    <Button onClick={verifyEnrollMfa} disabled={mfaLoading}>
                      {mfaLoading ? 'Verificando...' : 'Verificar e Ativar'}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
