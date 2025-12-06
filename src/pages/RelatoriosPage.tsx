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
  LabelList,
} from 'recharts';
import { FileText, TrendingUp, Clock, CheckCircle2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
export default function RelatoriosPage() {
  const [startDate, setStartDate] = useState<string>(() => format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState<Tables<'requests'>[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('requests').select('*');
      const remote = (data ?? []) as Tables<'requests'>[];
      let localRows: Tables<'requests'>[] = [];
      try {
        const raw = localStorage.getItem('requests:local');
        const arr = raw ? JSON.parse(raw) : [];
        localRows = Array.isArray(arr) ? arr : [];
      } catch { localRows = []; }
      setRows([...(localRows as Tables<'requests'>[]), ...remote]);
    };
    load();
  }, []);

  const filteredRequests = rows.filter((r) => {
    const d = r.data_solicitacao;
    const afterStart = !startDate || d >= startDate;
    const beforeEnd = !endDate || d <= endDate;
    return afterStart && beforeEnd;
  });

  const total = filteredRequests.length;
  const concluidos = filteredRequests.filter(r => r.status === 'concluido').length;
  const pendentes = filteredRequests.filter(r => r.status === 'pendente').length;
  const emAnalise = filteredRequests.filter(r => r.status === 'em_analise').length;
  const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;
  const tempoMedioDias = (() => {
    const concluidas = filteredRequests.filter(r => r.status === 'concluido');
    if (concluidas.length === 0) return '-';
    const diffs = concluidas.map(r => {
      const start = new Date(r.created_at);
      const end = new Date(r.updated_at || r.created_at);
      return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    });
    const avg = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return `${avg.toFixed(1)} dias`;
  })();

  const generatedAt = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR });

  const statusData = [
    { name: 'Pendente', value: pendentes, color: 'hsl(38, 92%, 50%)' },
    { name: 'Em Análise', value: emAnalise, color: 'hsl(199, 89%, 48%)' },
    { name: 'Concluído', value: concluidos, color: 'hsl(152, 69%, 40%)' },
  ];

  const priorityData = [
    { name: 'Baixa', value: filteredRequests.filter(r => r.prioridade === 'baixa').length, color: 'hsl(38, 92%, 50%)' },
    { name: 'Média', value: filteredRequests.filter(r => r.prioridade === 'media').length, color: 'hsl(199, 89%, 48%)' },
    { name: 'Alta', value: filteredRequests.filter(r => r.prioridade === 'alta').length, color: 'hsl(152, 69%, 40%)' },
  ];

  const monthMap = new Map<string, { label: string; date: Date; count: number }>();
  filteredRequests.forEach((r) => {
    const dt = new Date(r.data_solicitacao);
    const key = format(dt, 'yyyy-MM');
    const label = format(dt, 'LLL/yyyy', { locale: ptBR });
    const prev = monthMap.get(key);
    if (prev) monthMap.set(key, { ...prev, count: prev.count + 1 });
    else monthMap.set(key, { label, date: new Date(dt.getFullYear(), dt.getMonth(), 1), count: 1 });
  });
  const monthlyData = Array.from(monthMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((m) => ({ month: m.label, solicitacoes: m.count }));

  // Top Assuntos dinâmico
  const assuntoCounts = new Map<string, number>();
  filteredRequests.forEach(r => {
    const c = assuntoCounts.get(r.assunto) || 0;
    assuntoCounts.set(r.assunto, c + 1);
  });
  const topAssuntos = Array.from(assuntoCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([assunto, count]) => ({ assunto, count, percent: total > 0 ? Math.round((count / total) * 100) : 0 }));

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:pb-16">
      <div className="hidden print:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/medical-report.png" alt="Logo" className="h-12 w-12 object-contain" />
            <div>
              <div className="text-xl font-bold font-display text-foreground">Sistema de Demandas CAOSD</div>
              <div className="text-sm text-muted-foreground">Relatórios</div>
            </div>
          </div>
        </div>
        <div className="mt-4 border-b border-border" />
      </div>
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Estatísticas e indicadores do Centro de Apoio</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleExportPdf} aria-label="Exportar PDF" title="Exportar PDF">
          <FileDown className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <Card className="shadow-card print:hidden">
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
          value={tempoMedioDias}
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
      <div className="grid gap-6 lg:grid-cols-[0.4fr_0.3fr_0.3fr]">
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
                  <YAxis tick={false} tickLine={false} axisLine={false} />
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
                  >
                    <LabelList dataKey="solicitacoes" position="top" fill="hsl(var(--foreground))" />
                  </Bar>
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

        {/* Pie Chart - Prioridade */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Distribuição por Prioridade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-p-${index}`} fill={entry.color} />
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

      

        {/* Top Assuntos */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Assuntos Mais Frequentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topAssuntos.map((item, index) => (
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

        {/* Lista de Solicitações filtradas */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">Solicitações Filtradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Órgão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((r) => (
                    <TableRow key={String(r.id)}>
                      <TableCell className="max-w-[240px] truncate">{r.assunto}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.orgao_solicitante}</TableCell>
                      <TableCell className="capitalize">{r.status.replace('_', ' ')}</TableCell>
                      <TableCell className="capitalize">{r.prioridade}</TableCell>
                      <TableCell>{format(new Date(r.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))}
                  {filteredRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Nenhuma solicitação no período selecionado</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      <footer className="hidden print:flex fixed bottom-0 left-0 right-0 items-center justify-between px-8 py-2 border-t border-border text-xs text-muted-foreground bg-white">
        <span>Gerado em: {generatedAt}</span>
        <span>Sistema de Demandas CAOSD</span>
      </footer>
    </div>
  );
}
