import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/integrations/supabase/client';
import type { DbRequest } from '@/types/database';
import { FileText, Clock, FileSearch, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import type { Status, Priority } from '@/types/request';

export default function Inicio() {
  const [stats, setStats] = useState({ total: 0, pendentes: 0, emAnalise: 0, concluidos: 0 });
  const [recentRequests, setRecentRequests] = useState<DbRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
      const rows = (data ?? []) as DbRequest[];
      setRecentRequests(rows.slice(0, 4));
      const total = rows.length;
      const pendentes = rows.filter((r) => r.status === 'pendente').length;
      const emAnalise = rows.filter((r) => r.status === 'em_analise').length;
      const concluidos = rows.filter((r) => r.status === 'concluido').length;
      setStats({ total, pendentes, emAnalise, concluidos });
    };
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total" value={stats.total} icon={FileText} variant="default" />
        <StatCard title="Pendentes" value={stats.pendentes} icon={Clock} variant="warning" />
        <StatCard title="Em análise" value={stats.emAnalise} icon={FileSearch} variant="info" />
        <StatCard title="Concluídos" value={stats.concluidos} icon={CheckCircle2} variant="success" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/minhas-solicitacoes" className="gap-1">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentRequests.slice(0, 5).map((request) => (
              <Link
                key={request.id}
                to={`/solicitacao/${request.id}`}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{request.assunto}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {request.orgao_solicitante} • {format(new Date(request.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <StatusBadge status={request.status as Status} />
              </Link>
            ))}
            {recentRequests.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma solicitação recente.</p>
            )}
          </div>
        </CardContent>
      </Card>

      
      <footer className="pt-2">
        <div className="w-full text-center text-xs text-muted-foreground">
          © 2025 Sistema de Demandas CAODS | Desenvolvido pela Assessoria de Planejamento e Gestão
        </div>
      </footer>
    </div>
  );
}
