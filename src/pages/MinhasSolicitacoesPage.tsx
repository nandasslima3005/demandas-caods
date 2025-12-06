import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { DbRequest } from '@/types/database';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Status, Priority, STATUS_LABELS, PRIORITY_LABELS } from '@/types/request';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, ArrowRight, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MinhasSolicitacoesPage() {
  const FILTERABLE_STATUSES: Status[] = ['pendente', 'em_analise', 'concluido'];
  const FILTERABLE_PRIORITIES: Priority[] = ['baixa', 'media', 'alta'];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [requests, setRequests] = useState<DbRequest[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
      const rows = (data ?? []) as DbRequest[];
      
      // Calculate queue positions
      const pendentes = rows
        .filter((r) => r.status === 'pendente')
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const indexMap = new Map<string, number>();
      pendentes.forEach((r, i) => indexMap.set(String(r.id), i + 1));
      
      const withQueue = rows.map((r) => {
        const current = r.posicao_fila;
        const computed = indexMap.get(String(r.id)) ?? 0;
        return { ...r, posicao_fila: typeof current === 'number' && current > 0 ? current : computed };
      });
      setRequests(withQueue);
    };
    load();
  }, []);

  const daysInQueue = (req: DbRequest) => {
    if (req.status !== 'pendente' && req.status !== 'em_analise') return null;
    const start = req.created_at ? new Date(req.created_at) : new Date(req.data_solicitacao);
    const now = new Date();
    const ms = now.getTime() - start.getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };

  const badgeClass = (days: number) => {
    if (days <= 3) return 'bg-muted text-foreground';
    if (days <= 7) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.orgao_solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (request.numero_sei?.includes(searchTerm) ?? false);

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.prioridade === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Minhas Solicitações
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o status das suas demandas
          </p>
        </div>
        
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por assunto, órgão ou número SEI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(showFilters && 'bg-muted')}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-border animate-slide-up">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as Status | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {FILTERABLE_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {STATUS_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={(value) => setPriorityFilter(value as Priority | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    {FILTERABLE_PRIORITIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {PRIORITY_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(statusFilter !== 'all' || priorityFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {filteredRequests.length} solicitação(ões) encontrada(s)
      </p>

      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma solicitação encontrada com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request, index) => (
            <Link
              key={request.id}
              to={`/solicitacao/${request.id}`}
              className="block animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Card className="shadow-card hover:shadow-card-hover transition-all hover:border-primary/20">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {request.assunto}
                        </h3>
                        <StatusBadge status={request.status as Status} />
                        <PriorityBadge priority={request.prioridade as Priority} />
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {request.orgao_solicitante}
                      </p>

                      <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
                        {request.descricao}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium">SEI:</span> {request.numero_sei}
                        </span>
                        {request.numero_simp && (
                          <span>
                            <span className="font-medium">SIMP:</span> {request.numero_simp}
                          </span>
                        )}
                        <span>
                          <span className="font-medium">Data:</span>{' '}
                          {format(new Date(request.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                      {request.posicao_fila !== null && request.posicao_fila > 0 && (
                        <div className="text-center lg:text-right">
                          <p className="text-xs text-muted-foreground">Posição na fila</p>
                          <p className="text-2xl font-bold text-primary font-display">
                            #{request.posicao_fila}
                          </p>
                        </div>
                      )}
                      {(() => {
                        const d = daysInQueue(request);
                        if (d === null) return null;
                        return (
                          <div className="text-center lg:text-right">
                            <p className="text-xs text-muted-foreground">Dias</p>
                            <Badge className={badgeClass(d)}>{d}d</Badge>
                          </div>
                        );
                      })()}
                      <ArrowRight className="h-5 w-5 text-muted-foreground hidden lg:block" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
