import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ASSUNTOS_CNMP, Priority, RequestType } from '@/types/request';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, X, FileText, ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const REQUEST_TYPES: RequestType[] = [
  'Apoio aos Órgãos de Execução - 1º Grau',
  'Apoio aos Órgãos de Execução - 2º Grau',
  'Atendimento ao Público',
  'PGA de Políticas Públicas',
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
];

export default function NovaSolicitacaoPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [orgaos, setOrgaos] = useState<string[]>([]);
  const [showOrgaos, setShowOrgaos] = useState(false);
  const [formData, setFormData] = useState({
    orgaoSolicitante: '',
    tipoSolicitacao: '' as RequestType | '',
    dataRecebimento: new Date().toISOString().slice(0, 10),
    numeroSEI: '',
    numeroSIMP: '',
    assunto: '',
    descricao: '',
    prioridade: 'media' as Priority,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

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

  useEffect(() => {
    const loadOrgaos = async () => {
      try {
        const res = await fetch(`/solicitantes.csv?ts=${Date.now()}`, { cache: 'no-store' });
        const txt = await res.text();
        const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) return;
        const delim = lines[0].includes(';') ? ';' : ',';
        const values = lines.map((l) => l.split(delim)[0]?.trim()).filter((v) => v && v.length > 0);
        setOrgaos(Array.from(new Set(values)));
      } catch {}
    };
    loadOrgaos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orgaoSolicitante || !formData.tipoSolicitacao || !formData.dataRecebimento || !formData.numeroSEI || !formData.assunto || !formData.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    
    const now = new Date();
    const insertPayload = {
      user_id: userId ?? null,
      orgao_solicitante: formData.orgaoSolicitante,
      tipo_solicitacao: formData.tipoSolicitacao as RequestType,
      data_solicitacao: formData.dataRecebimento,
      numero_sei: formData.numeroSEI,
      numero_simp: formData.numeroSIMP || null,
      assunto: formData.assunto,
      descricao: formData.descricao,
      prioridade: formData.prioridade as Priority,
      status: 'pendente',
    };
    
    const { data, error } = await supabase.from('requests').insert(insertPayload).select('id').single();
    
    if (!error && data) {
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação foi registrada com sucesso.',
      });
      
      const requestId = data.id;
      
      // Create initial timeline event
      await supabase.from('timeline_events').insert({
        request_id: requestId,
        title: 'Solicitação Criada',
        description: 'A solicitação foi registrada no sistema.',
        status: 'pendente',
        created_by: userId,
      });
      
      // Upload attachments if any
      if (files.length > 0) {
        for (const file of files) {
          const clean = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `${requestId}/${Date.now()}_${clean}`;
          const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = await supabase.storage.from('attachments').getPublicUrl(path);
            await supabase.from('attachments').insert({
              request_id: requestId,
              name: file.name,
              type: file.type || 'application/octet-stream',
              size: file.size,
              url: urlData?.publicUrl ?? '',
            });
          }
        }
      }
      
      await recomputeQueuePositions();
      navigate('/minhas-solicitacoes');
    } else {
      toast({
        title: 'Erro ao enviar',
        description: error?.message || 'Tente novamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const recomputeQueuePositions = async () => {
    const { data } = await supabase
      .from('requests')
      .select('id,status,created_at,posicao_fila')
      .order('created_at', { ascending: true });
    const rows = (data ?? []) as any[];
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

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Nova Solicitação
          </h1>
          <p className="text-muted-foreground">
            Preencha os campos abaixo para registrar sua demanda
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Dados da Solicitação
            </CardTitle>
            <CardDescription>
              Campos marcados com * são obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Solicitação *</Label>
                <Select
                  value={formData.tipoSolicitacao}
                  onValueChange={(value: RequestType) =>
                    setFormData({ ...formData, tipoSolicitacao: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataRecebimento">Data de Recebimento da Demanda *</Label>
                <Input
                  id="dataRecebimento"
                  type="date"
                  value={formData.dataRecebimento}
                  onChange={(e) =>
                    setFormData({ ...formData, dataRecebimento: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgao">Órgão Solicitante *</Label>
              <div className="relative">
                <Input
                  id="orgao"
                  placeholder="Ex.: Promotoria de Justiça de Teresina"
                  value={formData.orgaoSolicitante}
                  onFocus={async () => { setShowOrgaos(true); try { const res = await fetch(`/solicitantes.csv?ts=${Date.now()}`, { cache: 'no-store' }); const txt = await res.text(); const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0); if (lines.length > 0) { const delim = lines[0].includes(';') ? ';' : ','; const values = lines.map((l) => l.split(delim)[0]?.trim()).filter((v) => v && v.length > 0); setOrgaos(Array.from(new Set(values))); } } catch {} }}
                  onBlur={() => setTimeout(() => setShowOrgaos(false), 100)}
                  onChange={(e) =>
                    setFormData({ ...formData, orgaoSolicitante: e.target.value })
                  }
                />
                {showOrgaos && formData.orgaoSolicitante && orgaos.filter((o) => o.toLowerCase().includes(formData.orgaoSolicitante.toLowerCase())).slice(0,6).length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 z-20 rounded-md border border-border bg-card shadow-sm">
                    {orgaos
                      .filter((o) => o.toLowerCase().includes(formData.orgaoSolicitante.toLowerCase()))
                      .slice(0,6)
                      .map((o) => (
                        <button
                          key={o}
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ ...formData, orgaoSolicitante: o });
                            setShowOrgaos(false);
                          }}
                        >
                          {o}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sei">Número do SEI *</Label>
                <Input
                  id="sei"
                  placeholder="Ex.: 12.34.2025.0001234/0001-01"
                  value={formData.numeroSEI}
                  maxLength={26}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroSEI: formatSEI(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="simp">Número do SIMP</Label>
                <Input
                  id="simp"
                  placeholder="Ex.: 123456-789/2025"
                  value={formData.numeroSIMP}
                  maxLength={15}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroSIMP: formatSIMP(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto (Tabela CNMP) *</Label>
              <Select
                value={formData.assunto}
                onValueChange={(value) =>
                  setFormData({ ...formData, assunto: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent>
                  {ASSUNTOS_CNMP.map((assunto) => (
                    <SelectItem key={assunto} value={assunto}>
                      {assunto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioridade *</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value: Priority) =>
                  setFormData({ ...formData, prioridade: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Solicitação *</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva detalhadamente sua solicitação..."
                rows={5}
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
              />
            </div>

          </CardContent>
        </Card>
        <Card className="shadow-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Anexos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                'hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
              )}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste arquivos
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOC, JPG, PNG (máx. 10MB cada)
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 rounded-lg border border-border p-3">
              <div className="font-display text-lg text-foreground">Prazo</div>
              <div className="mt-1 text-sm font-medium">
                {formData.prioridade === 'baixa'
                  ? '21 a 60 dias'
                  : formData.prioridade === 'media'
                  ? '6 a 20 dias'
                  : '1 a 5 dias'}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 gradient-primary border-0"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Enviando...'
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
