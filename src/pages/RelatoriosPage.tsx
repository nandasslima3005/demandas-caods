import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { mockRequests, mockStats } from '@/data/mockData';
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

const statusData = [
  { name: 'Pendente', value: mockStats.pendentes, color: 'hsl(38, 92%, 50%)' },
  { name: 'Em Análise', value: mockStats.emAnalise, color: 'hsl(199, 89%, 48%)' },
  { name: 'Em Andamento', value: mockStats.emAndamento, color: 'hsl(262, 83%, 58%)' },
  { name: 'Concluído', value: mockStats.concluidos, color: 'hsl(152, 69%, 40%)' },
];

const priorityData = [
  { name: 'Baixa', value: mockRequests.filter(r => r.prioridade === 'baixa').length },
  { name: 'Média', value: mockRequests.filter(r => r.prioridade === 'media').length },
  { name: 'Alta', value: mockRequests.filter(r => r.prioridade === 'alta').length },
  { name: 'Urgente', value: mockRequests.filter(r => r.prioridade === 'urgente').length },
];

const monthlyData = [
  { month: 'Set', solicitacoes: 12 },
  { month: 'Out', solicitacoes: 19 },
  { month: 'Nov', solicitacoes: mockStats.total },
  { month: 'Dez', solicitacoes: 8 },
];

export default function RelatoriosPage() {
  const taxaConclusao = Math.round((mockStats.concluidos / mockStats.total) * 100);

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

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Solicitações"
          value={mockStats.total}
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
          value={mockStats.concluidos}
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
