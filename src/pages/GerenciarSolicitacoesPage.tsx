import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
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
import type { Request } from '@/types/request';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, SlidersHorizontal, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
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
  type SortKey = 'assunto' | 'orgaoSolicitante' | 'numeroSEI' | 'dataSolicitacao' | 'status' | 'prioridade';
  const [sortKey, setSortKey] = useState<SortKey>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [, setTick] = useState(0);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    orgaoSolicitante: '',
    tipoSolicitacao: '' as RequestType | '',
    numeroSEI: '',
    numeroSIMP: '',
    assunto: '',
    descricao: '',
    prioridade: 'media' as Priority,
    status: 'pendente' as Status,
  });
  const [requests, setRequests] = useState<Request[]>([]);
  const [role, setRole] = useState<string>('');

  useEffect(() => {
    const loadRole = async () => {
      const { data } = await supabase.auth.getUser();
      const meta = data.user?.user_metadata ?? {};
      setRole((meta.role as string) ?? '');
    };
    loadRole();
    const load = async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('createdAt', { ascending: false });
      if (error) return;
      const rows = (data ?? []) as Tables<'requests'>[];
      const mapped = rows.map((r) => ({
        id: String(r.id),
        orgaoSolicitante: r.orgaoSolicitante,
        tipoSolicitacao: r.tipoSolicitacao,
        dataSolicitacao: r.dataSolicitacao,
        numeroSEI: r.numeroSEI,
        numeroSIMP: r.numeroSIMP ?? undefined,
        assunto: r.assunto,
        descricao: r.descricao,
        encaminhamento: r.encaminhamento ?? undefined,
        prioridade: r.prioridade,
        status: r.status,
        anexos: [],
        timeline: [],
        posicaoFila: r.posicaoFila ?? undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })) as Request[];
      setRequests(mapped);
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

  const getValue = (req: Request, key: SortKey): string | number => {
    if (key === 'dataSolicitacao') return new Date(req.dataSolicitacao).getTime();
    if (key === 'status') return STATUS_LABELS[req.status];
    if (key === 'prioridade') return PRIORITY_LABELS[req.prioridade];
    return req[key] as string;
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
    if (role !== 'gestor') { toast({ title: 'Acesso negado', description: 'Somente gestores podem excluir.', variant: 'destructive' }); return; }
    await supabase.from('requests').delete().eq('id', id);
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  const startEdit = (req: Request) => {
    if (role !== 'gestor') { toast({ title: 'Acesso negado', description: 'Somente gestores podem editar.', variant: 'destructive' }); return; }
    setEditId(req.id);
    setEditForm({
      orgaoSolicitante: req.orgaoSolicitante,
      tipoSolicitacao: req.tipoSolicitacao as RequestType,
      numeroSEI: req.numeroSEI,
      numeroSIMP: req.numeroSIMP ?? '',
      assunto: req.assunto,
      descricao: req.descricao,
      prioridade: req.prioridade as Priority,
      status: req.status as Status,
    });
    setIsEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editId) return;
    if (role !== 'gestor') { toast({ title: 'Acesso negado', description: 'Somente gestores podem editar.', variant: 'destructive' }); return; }
    const payload = {
      orgaoSolicitante: editForm.orgaoSolicitante,
      tipoSolicitacao: editForm.tipoSolicitacao as RequestType,
      numeroSEI: editForm.numeroSEI,
      numeroSIMP: editForm.numeroSIMP || null,
      assunto: editForm.assunto,
      descricao: editForm.descricao,
      prioridade: editForm.prioridade as Priority,
      status: editForm.status as Status,
      updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('requests').update(payload).eq('id', editId);
    if (!error) {
      setRequests(prev => prev.map(r => r.id === editId ? { ...r, ...payload, numeroSIMP: payload.numeroSIMP ?? undefined } as Request : r));
      toast({ title: 'Solicitação atualizada', description: 'As alterações foram salvas.' });
      setIsEditOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground">
          Gerenciar Solicitações
        </h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as solicitações do sistema
        </p>
      </div>

      {/* Filters */}
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

      {/* Table */}
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
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('orgaoSolicitante')}>
                    Órgão Solicitante {sortKey === 'orgaoSolicitante' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('numeroSEI')}>
                    SEI {sortKey === 'numeroSEI' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('dataSolicitacao')}>
                    Data {sortKey === 'dataSolicitacao' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
                <TableHead className="text-center uppercase text-black">
                  <button className="flex items-center justify-center gap-1 w-full uppercase" onClick={() => handleSort('status')}>
                    Status {sortKey === 'status' ? (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3" />}
                  </button>
                </TableHead>
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
                    {request.orgaoSolicitante}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {request.numeroSEI}
                  </TableCell>
                  <TableCell>
                    {format(new Date(request.dataSolicitacao), 'dd/MM/yy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={request.status} showIcon={false} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={request.prioridade} showIcon={false} />
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
                        {role === 'gestor' && (
                          <>
                            <DropdownMenuItem onClick={() => startEdit(request)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(request.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
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
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Editar Solicitação</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Órgão Solicitante</Label>
              <Input value={editForm.orgaoSolicitante} onChange={(e) => setEditForm({ ...editForm, orgaoSolicitante: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v as Status })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">
                    {STATUS_LABELS.pendente}
                  </SelectItem>
                  <SelectItem value="em_analise">{STATUS_LABELS.em_analise}</SelectItem>
                  <SelectItem value="concluido">{STATUS_LABELS.concluido}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Solicitação</Label>
              <Select value={editForm.tipoSolicitacao} onValueChange={(v) => setEditForm({ ...editForm, tipoSolicitacao: v as RequestType })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(['Apoio aos Órgãos de Execução - 1º Grau','Apoio aos Órgãos de Execução - 2º Grau','Atendimento ao Público','PGA de Políticas Públicas'] as RequestType[]).map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Número SEI</Label>
                <Input maxLength={26} value={editForm.numeroSEI} onChange={(e) => setEditForm({ ...editForm, numeroSEI: formatSEI(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Número SIMP</Label>
                <Input maxLength={15} value={editForm.numeroSIMP} onChange={(e) => setEditForm({ ...editForm, numeroSIMP: formatSIMP(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Select value={editForm.assunto} onValueChange={(v) => setEditForm({ ...editForm, assunto: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent>
                  {ASSUNTOS_CNMP.map((assunto) => (
                    <SelectItem key={assunto} value={assunto}>{assunto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea rows={4} value={editForm.descricao} onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={editForm.prioridade} onValueChange={(v) => setEditForm({ ...editForm, prioridade: v as Priority })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {(['baixa','media','alta'] as Priority[]).map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit}>Salvar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
  const formatSEI = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 21);
    const s1 = digits.slice(0, 2);
    const s2 = digits.slice(2, 4);
    const s3 = digits.slice(4, 8);
    const s4 = digits.slice(8, 15);
    const s5 = digits.slice(15, 19);
    const s6 = digits.slice(19, 21);
    let result = '';
    if (s1) result += s1;
    if (s2) result += '.' + s2;
    if (s3) result += '.' + s3;
    if (s4) result += '.' + s4;
    if (s5) result += '/' + s5;
    if (s6) result += '-' + s6;
    return result;
  };

  const formatSIMP = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 13);
    const s1 = digits.slice(0, 6);
    const s2 = digits.slice(6, 9);
    const s3 = digits.slice(9, 13);
    let result = '';
    if (s1) result += s1;
    if (s2) result += '-' + s2;
    if (s3) result += '/' + s3;
    return result;
  };
