import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Search, Filter, ArrowRight, FilePlus, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MinhasSolicitacoesPage() {
  const FILTERABLE_STATUSES: Status[] = ['pendente', 'em_analise', 'concluido'];
  const FILTERABLE_PRIORITIES: Priority[] = ['baixa', 'media', 'alta'];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [requests, setRequests] = useState<Tables<'requests'>[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('requests')
        .select('*')
        .order('createdAt', { ascending: false });
      const remote = (data ?? []) as Tables<'requests'>[];
      let local: Tables<'requests'>[] = [];
      try {
        const raw = localStorage.getItem('requests:local');
        const arr = raw ? JSON.parse(raw) : [];
        local = Array.isArray(arr) ? arr : [];
      } catch { local = []; }
      setRequests([...local, ...remote]);
    };
    load();
  }, []);

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.orgaoSolicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.numeroSEI.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.prioridade === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Minhas Solicitações
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o status das suas demandas
          </p>
        </div>
        <Button asChild className="gradient-primary border-0 shadow-md">
          <Link to="/nova-solicitacao">
            <FilePlus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredRequests.length} solicitação(ões) encontrada(s)
      </p>

      {/* Request List */}
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
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {request.assunto}
                        </h3>
                        <StatusBadge status={request.status} />
                        <PriorityBadge priority={request.prioridade} />
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {request.orgaoSolicitante}
                      </p>

                      <p className="text-sm text-foreground/80 line-clamp-2 mb-3">
                        {request.descricao}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium">SEI:</span> {request.numeroSEI}
                        </span>
                        {request.numeroSIMP && (
                          <span>
                            <span className="font-medium">SIMP:</span> {request.numeroSIMP}
                          </span>
                        )}
                        <span>
                          <span className="font-medium">Data:</span>{' '}
                          {format(new Date(request.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>

                    {/* Position and Arrow */}
                    <div className="flex items-center gap-4 lg:flex-col lg:items-end">
                      {request.posicaoFila !== undefined && request.posicaoFila > 0 && (
                        <div className="text-center lg:text-right">
                          <p className="text-xs text-muted-foreground">Posição na fila</p>
                          <p className="text-2xl font-bold text-primary font-display">
                            #{request.posicaoFila}
                          </p>
                        </div>
                      )}
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
