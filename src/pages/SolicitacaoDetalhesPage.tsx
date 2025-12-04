import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import type { Tables } from '@/integrations/supabase/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { PriorityBadge } from '@/components/ui/priority-badge';
import { Timeline } from '@/components/ui/timeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const [request, setRequest] = useState<Tables<'requests'> | null>(null);
  const [attachments, setAttachments] = useState<Tables<'attachments'>[]>([]);
  const [timeline, setTimeline] = useState<Tables<'timeline_events'>[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      if (String(id).startsWith('local-')) {
        try {
          const raw = localStorage.getItem('requests:local');
          const arr = raw ? JSON.parse(raw) : [];
          const found = Array.isArray(arr) ? (arr.find((r: any) => String(r.id) === String(id)) ?? null) : null;
          setRequest(found as Tables<'requests'> | null);
        } catch { setRequest(null); }
      } else {
        const { data } = await supabase.from('requests').select('*').eq('id', id).single();
        if (data) {
          setRequest((data ?? null) as Tables<'requests'> | null);
        } else {
          try {
            const raw = localStorage.getItem('requests:local');
            const arr = raw ? JSON.parse(raw) : [];
            const found = Array.isArray(arr) ? (arr.find((r: any) => String(r.id) === String(id)) ?? null) : null;
            setRequest(found as Tables<'requests'> | null);
          } catch { setRequest(null); }
        }
      }
      const { data: att } = await supabase.from('attachments').select('*').eq('requestId', id);
      let local: Tables<'attachments'>[] = [];
      try {
        const raw = localStorage.getItem(`attachments:local:${id}`);
        const arr = raw ? JSON.parse(raw) : [];
        local = Array.isArray(arr) ? arr : [];
      } catch { local = []; }
      setAttachments([...(local as Tables<'attachments'>[]), ...((att ?? []) as Tables<'attachments'>[])]);
      const { data: tl } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('requestId', id)
        .order('date', { ascending: true });
      setTimeline((tl ?? []) as Tables<'timeline_events'>[]);

      // Try to sync local attachments for this request
      if (local.length > 0 && id && !String(id).startsWith('local-')) {
        const dataUrlToBlob = (dataUrl: string) => {
          const parts = dataUrl.split(',');
          const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
          const bstr = atob(parts[1] || '');
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) u8arr[n] = bstr.charCodeAt(n);
          return new Blob([u8arr], { type: mime });
        };
        const key = `attachments:local:${id}`;
        const remaining: any[] = [];
        for (const a of local as any[]) {
          try {
            const blob = dataUrlToBlob(a.url);
            const clean = String(a.name || 'anexo').replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${id}/${Date.now()}_${clean}`;
            const up = await supabase.storage.from('attachments').upload(path, blob, { upsert: true });
            if (up.error) { remaining.push(a); continue; }
            const { data: urlData } = await supabase.storage.from('attachments').getPublicUrl(path);
            const publicUrl = urlData?.publicUrl ?? '';
            const ins = await supabase.from('attachments').insert({ requestId: id, name: a.name, type: a.type || 'application/octet-stream', size: a.size || 0, url: publicUrl, uploadedAt: new Date().toISOString() });
            if (ins.error) { remaining.push(a); }
          } catch { remaining.push(a); }
        }
        try {
          if (remaining.length > 0) localStorage.setItem(key, JSON.stringify(remaining));
          else localStorage.removeItem(key);
        } catch { void 0; }
        const { data: att2 } = await supabase.from('attachments').select('*').eq('requestId', id);
        setAttachments([...(remaining as Tables<'attachments'>[]), ...((att2 ?? []) as Tables<'attachments'>[])]);
      }
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
      {/* Header */}
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
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.prioridade} />
          </div>
          <p className="text-muted-foreground">
            Solicitação #{request.id} • Criada em{' '}
            {format(new Date(request.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Position Banner */}
      {request.posicaoFila !== undefined && request.posicaoFila > 0 && (
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
                #{request.posicaoFila}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Card */}
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
                    <p className="font-medium">{request.orgaoSolicitante}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo de Solicitação</p>
                    <p className="font-medium">{request.tipoSolicitacao}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Número SEI</p>
                    <p className="font-medium">{request.numeroSEI}</p>
                  </div>
                </div>

                {request.numeroSIMP && (
                  <div className="flex items-start gap-3">
                    <Hash className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Número SIMP</p>
                      <p className="font-medium">{request.numeroSIMP}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data da Solicitação</p>
                    <p className="font-medium">
              {format(new Date(request.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })}
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

          {/* Timeline Card */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Linha do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline events={timeline.map((e) => ({ id: e.id, date: e.date, title: e.title, description: e.description ?? '', status: e.status, user: e.user ?? undefined }))} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attachments */}
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
                      {anexo.url ? (
                        <a
                          href={anexo.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      ) : (
                        <Button variant="ghost" size="icon" className="shrink-0" disabled>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-lg">
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Adicionar comentário
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Anexar documento
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Solicitar atualização
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
