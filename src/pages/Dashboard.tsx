import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  FileText,
  Clock,
  FileSearch,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, pendentes: 0, emAnalise: 0, emAndamento: 0, concluidos: 0, urgentes: 0 });
  const [recentRequests, setRecentRequests] = useState<Tables<'requests'>[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .order('createdAt', { ascending: false });
      const rows = (data ?? []) as Tables<'requests'>[];
      setRecentRequests(rows.slice(0, 4));
      const total = rows.length;
      const pendentes = rows.filter((r) => r.status === 'pendente').length;
      const emAnalise = rows.filter((r) => r.status === 'em_analise').length;
      const emAndamento = rows.filter((r) => r.status === 'em_andamento').length;
      const concluidos = rows.filter((r) => r.status === 'concluido').length;
      const urgentes = rows.filter((r) => r.prioridade === 'urgente').length;
      setStats({ total, pendentes, emAnalise, emAndamento, concluidos, urgentes });
    };
    load();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral das solicitações do Centro de Apoio
          </p>
        </div>
        <Button asChild className="gradient-primary border-0 shadow-md">
          <Link to="/nova-solicitacao">
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={FileText}
          variant="default"
        />
        <StatCard
          title="Pendentes"
          value={stats.pendentes}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Em Análise"
          value={stats.emAnalise}
          icon={FileSearch}
          variant="info"
        />
        <StatCard
          title="Concluídos"
          value={stats.concluidos}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Recent Requests */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Solicitações Recentes</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/minhas-solicitacoes" className="gap-1">
              Ver todas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRequests.map((request) => (
              <Link
                key={request.id}
                to={`/solicitacao/${request.id}`}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground truncate">
                      {request.assunto}
                    </h3>
                    <StatusBadge status={request.status} />
                    <PriorityBadge priority={request.prioridade} />
                  </div>
                  <p className="text-sm text-muted-foreground truncate mb-2">
                    {request.orgaoSolicitante}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>SEI: {request.numeroSEI}</span>
                    <span>
                      {format(new Date(request.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    {request.posicaoFila !== undefined && request.posicaoFila > 0 && (
                      <span className="text-primary font-medium">
                        Posição na fila: #{request.posicaoFila}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Orientações para Solicitações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              • Preencha todos os campos obrigatórios com informações precisas.
            </p>
            <p>
              • Anexe documentos relevantes para agilizar a análise.
            </p>
            <p>
              • Utilize o número SEI correto para facilitar o rastreamento.
            </p>
            <p>
              • Acompanhe o status da sua solicitação em "Minhas Solicitações".
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Tempo Médio de Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Prioridade Baixa</span>
                <span className="text-sm font-medium">7-10 dias úteis</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prioridade Média</span>
                <span className="text-sm font-medium">5-7 dias úteis</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Prioridade Alta</span>
                <span className="text-sm font-medium">2-3 dias úteis</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
