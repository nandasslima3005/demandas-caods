import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { DbRequest } from '@/types/database';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Status, Priority, STATUS_LABELS, PRIORITY_LABELS, ASSUNTOS_CNMP, RequestType } from '@/types/request';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, MoreHorizontal, Eye, Edit, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function GerenciarSolicitacoesPage() {
  const FILTERABLE_STATUSES: Status[] = ['pendente', 'em_analise', 'concluido'];
  const FILTERABLE_PRIORITIES: Priority[] = ['baixa', 'media', 'alta'];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  type SortKey = 'assunto' | 'orgao_solicitante' | 'numero_sei' | 'data_solicitacao' | 'status' | 'prioridade';
  const [sortKey, setSortKey] = useState<SortKey>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    orgao_solicitante: '',
    tipo_solicitacao: '' as RequestType | '',
    numero_sei: '',
    numero_simp: '',
    assunto: '',
    descricao: '',
    prioridade: 'media' as Priority,
    status: 'pendente' as Status,
  });
  const [requests, setRequests] = useState<DbRequest[]>([]);
  const [role] = useState<string>('gestor');

  useEffect(() => {
    
    
    const load = async () => {
      await recomputeQueuePositions();
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setRequests(data as DbRequest[]);
      }
    };
    load();
  }, []);

  const recomputeQueuePositions = async () => {
    const { data } = await supabase
      .from('requests')
      .select('id,status,created_at,posicao_fila')
      .order('created_at', { ascending: true });
    const rows = (data ?? []) as DbRequest[];
    const updates: Array<Promise<any>> = [];
    let pos = 1;
    for (const r of rows) {
      const desired = r.status === 'pendente' ? pos++ : null;
      const current = typeof r.posicao_fila === 'number' ? r.posicao_fila : null;
      if (current !== desired) {
        updates.push(
          supabase.from('requests').update({ posicao_fila: desired }).eq('id', r.id)
        );
      }
    }
    if (updates.length > 0) await Promise.all(updates);
  };

  const daysInQueue = (req: DbRequest) => {
    if (req.status !== 'pendente' && req.status !== 'em_analise') return null;
    const start = req.data_solicitacao ? new Date(req.data_solicitacao) : new Date(req.created_at);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
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

  const getValue = (req: DbRequest, key: SortKey): string | number => {
    if (key === 'data_solicitacao') return new Date(req.data_solicitacao).getTime();
    if (key === 'status') return STATUS_LABELS[req.status as Status] ?? req.status;
    if (key === 'prioridade') return PRIORITY_LABELS[req.prioridade as Priority] ?? req.prioridade;
    return (req as any)[key] as string;
  };

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortKey) return 0;
    const dir = sortOrder === 'asc' ? 1 : -1;
    const va = getValue(a, sortKey);
    const vb = getValue(b, sortKey);
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb)) * dir;
  });

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('requests').delete().eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Solicitação excluída' });
  };

  const startEdit = (req: DbRequest) => {
    setEditId(req.id);
    setEditForm({
      orgao_solicitante: req.orgao_solicitante,
      tipo_solicitacao: req.tipo_solicitacao as RequestType,
      numero_sei: req.numero_sei ?? '',
      numero_simp: req.numero_simp ?? '',
      assunto: req.assunto,
      descricao: req.descricao,
      prioridade: req.prioridade as Priority,
      status: req.status as Status,
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    
    const { error } = await supabase.from('requests').update({
      orgao_solicitante: editForm.orgao_solicitante,
      tipo_solicitacao: editForm.tipo_solicitacao,
      numero_sei: editForm.numero_sei,
      numero_simp: editForm.numero_simp || null,
      assunto: editForm.assunto,
      descricao: editForm.descricao,
      prioridade: editForm.prioridade,
      status: editForm.status,
    }).eq('id', editId);
    
    if (!error) {
      setRequests(prev => prev.map(r => 
        r.id === editId 
          ? { ...r, ...editForm, numero_simp: editForm.numero_simp || null } 
          : r
      ));
      
      // Add timeline event
      await supabase.from('timeline_events').insert({
        request_id: editId,
        title: 'Status Atualizado',
        description: `Status alterado para: ${STATUS_LABELS[editForm.status as Status]}`,
        status: editForm.status,
        created_by: null,
      });
      
      await recomputeQueuePositions();
      const { data } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setRequests(data as DbRequest[]);

      toast({ title: 'Solicitação atualizada' });
      setIsEditOpen(false);
    } else {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Gerenciar Solicitações
        </h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as solicitações do sistema
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as Status | 'all')}
            >
              <SelectTrigger className="w-[180px]">
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
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center">
        <p className="text-sm text-muted-foreground">
          {filteredRequests.length} solicitação(ões)
        </p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-accent">
              <TableRow>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('assunto')}>
                    Assunto {sortKey === 'assunto' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('orgao_solicitante')}>
                    Órgão {sortKey === 'orgao_solicitante' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('numero_sei')}>
                    SEI {sortKey === 'numero_sei' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('data_solicitacao')}>
                    Data {sortKey === 'data_solicitacao' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('status')}>
                    Status {sortKey === 'status' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">Dias</TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('prioridade')}>
                    Prioridade {sortKey === 'prioridade' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-right uppercase text-black">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">
                    {request.assunto}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {request.orgao_solicitante}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {request.numero_sei}
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.data_solicitacao), 'dd/MM/yy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status as Status} showIcon={false} />
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const d = daysInQueue(request);
                      if (d === null) return <span className="text-muted-foreground">-</span>;
                      return <Badge className={badgeClass(d)}>{d}d</Badge>;
                    })()}
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={request.prioridade as Priority} showIcon={false} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/solicitacao/${request.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => startEdit(request)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(request.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Editar Solicitação</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Órgão Solicitante</Label>
              <Input
                value={editForm.orgao_solicitante}
                onChange={(e) => setEditForm({ ...editForm, orgao_solicitante: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Solicitação</Label>
              <Select
                value={editForm.tipo_solicitacao}
                onValueChange={(v) => setEditForm({ ...editForm, tipo_solicitacao: v as RequestType })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Apoio aos Órgãos de Execução - 1º Grau', 'Apoio aos Órgãos de Execução - 2º Grau', 'Atendimento ao Público', 'PGA de Políticas Públicas'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número SEI</Label>
                <Input
                  value={editForm.numero_sei}
                  onChange={(e) => setEditForm({ ...editForm, numero_sei: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Número SIMP</Label>
                <Input
                  value={editForm.numero_simp}
                  onChange={(e) => setEditForm({ ...editForm, numero_simp: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Select
                value={editForm.assunto}
                onValueChange={(v) => setEditForm({ ...editForm, assunto: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSUNTOS_CNMP.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editForm.descricao}
                onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v as Status })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['pendente', 'em_analise', 'concluido'] as Status[]).map((k) => (
                      <SelectItem key={k} value={k}>{STATUS_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={editForm.prioridade}
                  onValueChange={(v) => setEditForm({ ...editForm, prioridade: v as Priority })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button className="gradient-primary border-0" onClick={saveEdit}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
