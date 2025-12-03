import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { FileText, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
export default function RelatoriosPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [rows, setRows] = useState<Tables<'requests'>[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('requests').select('*');
      setRows((data ?? []) as Tables<'requests'>[]);
    };
    load();
  }, []);

  const filteredRequests = rows.filter((r) => {
    const d = r.dataSolicitacao as string;
    const afterStart = !startDate || d >= startDate;
    const beforeEnd = !endDate || d <= endDate;
    return afterStart && beforeEnd;
  });

  const total = filteredRequests.length;
  const concluidos = filteredRequests.filter(r => r.status === 'concluido').length;
  const pendentes = filteredRequests.filter(r => r.status === 'pendente').length;
  const emAnalise = filteredRequests.filter(r => r.status === 'em_analise').length;
  const emAndamento = filteredRequests.filter(r => r.status === 'em_andamento').length;
  const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  const statusData = [
    { name: 'Pendente', value: pendentes, color: 'hsl(38, 92%, 50%)' },
    { name: 'Em Análise', value: emAnalise, color: 'hsl(199, 89%, 48%)' },
    { name: 'Em Andamento', value: emAndamento, color: 'hsl(262, 83%, 58%)' },
    { name: 'Concluído', value: concluidos, color: 'hsl(152, 69%, 40%)' },
  ];

  const priorityData = [
    { name: 'Baixa', value: filteredRequests.filter(r => r.prioridade === 'baixa').length },
    { name: 'Média', value: filteredRequests.filter(r => r.prioridade === 'media').length },
    { name: 'Alta', value: filteredRequests.filter(r => r.prioridade === 'alta').length },
    { name: 'Urgente', value: filteredRequests.filter(r => r.prioridade === 'urgente').length },
  ];

  const monthMap = new Map<string, { label: string; date: Date; count: number }>();
  filteredRequests.forEach((r) => {
    const dt = new Date(r.dataSolicitacao);
    const key = format(dt, 'yyyy-MM');
    const label = format(dt, 'LLL', { locale: ptBR });
    const prev = monthMap.get(key);
    if (prev) monthMap.set(key, { ...prev, count: prev.count + 1 });
    else monthMap.set(key, { label, date: new Date(dt.getFullYear(), dt.getMonth(), 1), count: 1 });
  });
  const monthlyData = Array.from(monthMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((m) => ({ month: m.label, solicitacoes: m.count }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Relatórios
        </h1>
        <p className="text-muted-foreground">
          Estatísticas e indicadores do Centro de Apoio
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Início</div>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Fim</div>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Solicitações"
          value={total}
          icon={FileText}
          variant="primary"
        />
        <StatCard
          title="Taxa de Conclusão"
          value={`${taxaConclusao}%`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Tempo Médio"
          value="3.2 dias"
          icon={Clock}
          variant="info"
        />
        <StatCard
          title="Concluídas no Mês"
          value={concluidos}
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Solicitações por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar
                    dataKey="solicitacoes"
                    fill="hsl(199, 89%, 32%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Status */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Distribuição por Prioridade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(172, 66%, 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Assuntos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display text-lg">
            Assuntos Mais Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { assunto: 'Acesso à Saúde', count: 8, percent: 40 },
              { assunto: 'Judicialização da Saúde', count: 5, percent: 25 },
              { assunto: 'Assistência Farmacêutica', count: 4, percent: 20 },
              { assunto: 'Vigilância Sanitária', count: 2, percent: 10 },
              { assunto: 'Saúde Mental', count: 1, percent: 5 },
            ].map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.assunto}</span>
                  <span className="text-muted-foreground">{item.count} solicitações</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
