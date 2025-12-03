import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needConfirm, setNeedConfirm] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate('/inicio');
    };
    check();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Informe suas credenciais', description: 'Preencha email e senha.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      if (typeof error.message === 'string' && error.message.toLowerCase().includes('confirm')) {
        setNeedConfirm(true);
        toast({ title: 'E-mail não confirmado', description: 'Reenvie o e-mail de confirmação para ativar sua conta.', variant: 'destructive' });
      } else {
        toast({ title: 'Falha no login', description: 'Verifique email e senha.', variant: 'destructive' });
      }
      return;
    }
    navigate('/inicio');
  };

  const resendConfirmation = async () => {
    if (!email) {
      toast({ title: 'Informe seu e-mail', description: 'Preencha o e-mail institucional.', variant: 'destructive' });
      return;
    }
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) {
      toast({ title: 'Não foi possível reenviar', description: 'Tente novamente mais tarde.', variant: 'destructive' });
      return;
    }
    toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada para confirmar a conta.' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex flex-col">
      <header className="pt-8 pb-2 flex justify-center">
        <img src="/logo_caods.png" alt="CAODS" className="h-24 w-auto mix-blend-multiply opacity-95" />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold font-lostages text-foreground text-center mb-6">Sistema de Demandas CAODS</h1>
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>E-mail Institucional</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seuemail@mppi.mp.br" />
                </div>
                <div className="space-y-2">
                  <Label>Senha</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" />
                </div>
              <Button type="submit" className="w-full gradient-primary border-0" disabled={loading}>
                {loading ? 'Acessando...' : (<><LogIn className="h-4 w-4 mr-2" />Acessar</>)}
              </Button>
              {needConfirm && (
                <div className="text-center">
                  <Button type="button" variant="outline" onClick={resendConfirmation} disabled={resending}>
                    {resending ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
                  </Button>
                </div>
              )}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <footer className="py-6">
        <p className="text-center text-xs text-muted-foreground">
          © 2025 Sistema de Demandas CAODS | Desenvolvido pela Assessoria de Planejamento e Gestão
        </p>
      </footer>
    </div>
  );
}
