import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';

export function AppLayout() {
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; description: string; status: string; created_at: string }>>([]);
  useEffect(() => {
    const channel = supabase
      .channel('timeline_events_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_events' }, (payload: any) => {
        const n = payload.new as { id: string; title: string; description: string; status: string; created_at: string };
        setNotifications((prev) => [n, ...prev].slice(0, 20));
      })
      .subscribe();
    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <AppSidebar />
      </div>
      
      <div className="pl-64 print:pl-0 transition-all duration-300">
        <header className="sticky top-0 z-30 h-16 bg-card border-b-2 border-border print:hidden">
          <div className="flex items-center h-full px-6 gap-3">
            <img src="/logo_caods.png" alt="CAODS" className="h-10 w-auto mix-blend-multiply opacity-95" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-display text-foreground">Sistema de Demandas do Centro de Apoio Operacional de Defesa da Saúde (CAODS)</h1>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {notifications.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground">Sem novas notificações</div>
                  )}
                  {notifications.map((n) => (
                    <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1">
                      <span className="text-sm font-medium">{n.title}</span>
                      <span className="text-xs text-muted-foreground">{n.description}</span>
                      <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
