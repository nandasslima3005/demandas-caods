import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Bell, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

export function AppLayout() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata ?? {};
      setName((meta.name as string) ?? data.user?.email ?? '');
      const metaRole = (meta.role as string) ?? '';
      setRole(metaRole);
      setEmail(data.user?.email ?? '');
      setAvatarUrl((meta.avatar_url as string) ?? null);
      if (!metaRole && data.user?.email) {
        try {
          const { data: prof } = await supabase.from('profiles').select('role').eq('email', data.user.email).limit(1).maybeSingle();
          if (prof?.role) setRole(prof.role as string);
        } catch { void 0; }
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!email) return;
    try {
      const key = `avatar:${email}`;
      const stored = localStorage.getItem(key);
      if (stored) setAvatarUrl(stored);
    } catch { void 0; }
  }, [email]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string' && detail.length > 0) {
        setAvatarUrl(detail);
      }
    };
    window.addEventListener('avatar:update', handler as EventListener);
    return () => { window.removeEventListener('avatar:update', handler as EventListener); };
  }, []);

  const initials = (name || '').split(' ').filter(Boolean).map(p => p[0]).slice(0,2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <AppSidebar />
      </div>
      
      {/* Main Content */}
      <div className="pl-64 print:pl-0 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-sm border-b border-border print:hidden">
          <div className="flex items-center justify-between h-full px-6">
            <div className="flex items-center gap-4 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar solicitações..."
                  className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="text-right">
                  <p className="text-sm font-medium">{name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{role === 'gestor' ? 'Gestor' : (role === 'requisitante' ? 'Requisitante' : 'Usuário')}</p>
                </div>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-border" onError={() => setAvatarUrl(null)} />
                ) : (
                  <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">{initials || 'U'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
