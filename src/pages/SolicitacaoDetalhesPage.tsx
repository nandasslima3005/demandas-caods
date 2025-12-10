import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import type { DbRequest, DbAttachment, DbTimelineEvent } from '@/types/database';
import type { Status, Priority } from '@/types/request';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Timeline } from '@/components/ui/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Hash,
  Paperclip,
  Download,
  Users,
} from 'lucide-react';

export default function SolicitacaoDetalhesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState<DbRequest | null>(null);
  const [attachments, setAttachments] = useState<DbAttachment[]>([]);
  const [timeline, setTimeline] = useState<DbTimelineEvent[]>([]);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      
      const { data } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      setRequest((data as DbRequest) ?? null);
      
      const { data: att } = await supabase
        .from('attachments')
        .select('*')
        .eq('request_id', id);
      setAttachments((att as DbAttachment[]) ?? []);
      
      const { data: tl } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('request_id', id)
        .order('created_at', { ascending: true });
      setTimeline((tl as DbTimelineEvent[]) ?? []);
    };
    load();
  }, [id]);

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h1 className="text-2xl font-bold mb-4">Solicitação não encontrada</h1>
        <Button onClick={() => navigate('/minhas-solicitacoes')}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0 mt-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-display text-foreground">
              {request.assunto}
            </h1>
            <StatusBadge status={request.status as Status} />
            <PriorityBadge priority={request.prioridade as Priority} />
          </div>
          <p className="text-muted-foreground">
            Solicitação #{request.id.slice(0, 8)} • Criada em{' '}
            {format(new Date(request.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {request.posicao_fila !== null && request.posicao_fila > 0 && (
        <Card className="gradient-primary text-primary-foreground shadow-lg">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                <div>
                  <p className="font-medium">Posição na fila de atendimento</p>
                  <p className="text-sm opacity-90">
                    Sua solicitação está sendo processada na ordem de prioridade
                  </p>
                </div>
              </div>
              <div className="text-4xl font-bold font-display">
                #{request.posicao_fila}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Detalhes da Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Órgão Solicitante</p>
                    <p className="font-medium">{request.orgao_solicitante}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Solicitação</p>
                    <p className="font-medium">{request.tipo_solicitacao}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Número SEI</p>
                    <p className="font-medium">{request.numero_sei}</p>
                  </div>
                </div>

                {request.numero_simp && (
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Número SIMP</p>
                      <p className="font-medium">{request.numero_simp}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data da Solicitação</p>
                    <p className="font-medium">
                      {format(new Date(request.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Descrição</p>
                <p className="text-foreground leading-relaxed">{request.descricao}</p>
              </div>

              {request.encaminhamento && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Encaminhamento</p>
                    <p className="text-foreground leading-relaxed">{request.encaminhamento}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timeline.map((e) => ({
                id: e.id,
                date: e.created_at,
                title: e.title,
                description: e.description ?? '',
                status: e.status as Status,
              }))} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anexos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum anexo
                </p>
              ) : (
                <div className="space-y-2">
                  {attachments.map((anexo) => (
                    <div
                      key={anexo.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{anexo.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(anexo.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <a
                        href={anexo.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsCommentOpen(true)}>
                Adicionar comentário
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsUploadOpen(true)}>
                Anexar documento
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setIsUpdateOpen(true)}>
                Solicitar atualização
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Adicionar Comentário */}
      <Sheet open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Adicionar comentário</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label>Comentário</Label>
              <Textarea rows={4} value={commentText} onChange={(e) => setCommentText(e.target.value)} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsCommentOpen(false)}>Cancelar</Button>
            <Button
              className="gradient-primary border-0"
              disabled={isSubmitting || !commentText.trim()}
              onClick={async () => {
                if (!id || !commentText.trim()) return;
                setIsSubmitting(true);
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData.user?.id ?? null;
                const { data: ins, error } = await supabase.from('timeline_events').insert({
                  request_id: id,
                  title: 'Comentário',
                  description: commentText.trim(),
                  status: request?.status ?? 'pendente',
                  created_by: userId,
                }).select('*').single();
                if (!error && ins) {
                  setTimeline((prev) => [...prev, ins as DbTimelineEvent]);
                  setCommentText('');
                  setIsCommentOpen(false);
                  toast({ title: 'Comentário adicionado' });
                } else {
                  toast({ title: 'Erro ao adicionar comentário', variant: 'destructive' });
                }
                setIsSubmitting(false);
              }}
            >
              Salvar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Anexar Documento */}
      <Sheet open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Anexar documento</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label>Selecionar arquivo(s)</Label>
              <Input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => { if (e.target.files) setUploadFiles(Array.from(e.target.files)); }} />
              {uploadFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">{uploadFiles.length} arquivo(s) selecionado(s)</p>
              )}
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setIsUploadOpen(false); setUploadFiles([]); }}>Cancelar</Button>
            <Button
              className="gradient-primary border-0"
              disabled={isSubmitting || uploadFiles.length === 0}
              onClick={async () => {
                if (!id || uploadFiles.length === 0) return;
                setIsSubmitting(true);
                try {
                  for (const file of uploadFiles) {
                    const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const path = `${id}/${Date.now()}_${clean}`;
                    const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file, { upsert: true });
                    if (uploadError) continue;
                    const { data: urlData } = await supabase.storage.from('attachments').getPublicUrl(path);
                    const { data: ins } = await supabase.from('attachments').insert({
                      request_id: id,
                      name: file.name,
                      type: file.type || 'application/octet-stream',
                      size: file.size,
                      url: urlData?.publicUrl ?? '',
                    }).select('*').single();
                    if (ins) setAttachments((prev) => [...prev, ins as unknown as DbAttachment]);
                  }
                  toast({ title: 'Arquivo(s) anexado(s)' });
                  setUploadFiles([]);
                  setIsUploadOpen(false);
                } catch {
                  toast({ title: 'Erro ao anexar', variant: 'destructive' });
                }
                setIsSubmitting(false);
              }}
            >
              Enviar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Solicitar Atualização */}
      <Sheet open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Solicitar atualização</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea rows={4} value={updateText} onChange={(e) => setUpdateText(e.target.value)} />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Cancelar</Button>
            <Button
              className="gradient-primary border-0"
              disabled={isSubmitting || !updateText.trim()}
              onClick={async () => {
                if (!id || !updateText.trim()) return;
                setIsSubmitting(true);
                const { data: userData } = await supabase.auth.getUser();
                const userId = userData.user?.id ?? null;
                const { data: ins, error } = await supabase.from('timeline_events').insert({
                  request_id: id,
                  title: 'Solicitação de atualização',
                  description: updateText.trim(),
                  status: request?.status ?? 'pendente',
                  created_by: userId,
                }).select('*').single();
                if (!error && ins) {
                  setTimeline((prev) => [...prev, ins as DbTimelineEvent]);
                  setUpdateText('');
                  setIsUpdateOpen(false);
                  toast({ title: 'Atualização solicitada' });
                } else {
                  toast({ title: 'Erro ao solicitar atualização', variant: 'destructive' });
                }
                setIsSubmitting(false);
              }}
            >
              Enviar
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
