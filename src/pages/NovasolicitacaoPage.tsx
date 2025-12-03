import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import type { Request } from '@/types/request';
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
  const location = useLocation();
  const editRequest = (location.state as { request?: Request } | null)?.request;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    orgaoSolicitante: editRequest?.orgaoSolicitante ?? '',
    tipoSolicitacao: (editRequest?.tipoSolicitacao as RequestType | '') ?? ('' as RequestType | ''),
    numeroSEI: editRequest?.numeroSEI ?? '',
    numeroSIMP: editRequest?.numeroSIMP ?? '',
    assunto: editRequest?.assunto ?? '',
    descricao: editRequest?.descricao ?? '',
    prioridade: (editRequest?.prioridade as Priority) ?? ('media' as Priority),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orgaoSolicitante || !formData.tipoSolicitacao || !formData.numeroSEI || !formData.assunto || !formData.descricao) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    if (editRequest) {
      const { error } = await supabase.from('requests').update({
        orgaoSolicitante: formData.orgaoSolicitante,
        tipoSolicitacao: formData.tipoSolicitacao as RequestType,
        numeroSEI: formData.numeroSEI,
        numeroSIMP: formData.numeroSIMP || null,
        assunto: formData.assunto,
        descricao: formData.descricao,
        prioridade: formData.prioridade as Priority,
        updatedAt: new Date().toISOString(),
      }).eq('id', editRequest.id);
      if (!error) {
        toast({
          title: 'Solicitação atualizada!',
          description: 'As alterações foram salvas com sucesso.',
        });
        navigate('/gerenciar');
      }
    } else {
      const now = new Date();
      const insertPayload = {
        orgaoSolicitante: formData.orgaoSolicitante,
        tipoSolicitacao: formData.tipoSolicitacao as RequestType,
        dataSolicitacao: now.toISOString().slice(0,10),
        numeroSEI: formData.numeroSEI,
        numeroSIMP: formData.numeroSIMP || null,
        assunto: formData.assunto,
        descricao: formData.descricao,
        prioridade: formData.prioridade as Priority,
        status: 'pendente' as const,
        posicaoFila: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      const { data, error } = await supabase.from('requests').insert(insertPayload).select('id').single();
      if (!error) {
        toast({
          title: 'Solicitação enviada!',
          description: 'Sua solicitação foi registrada com sucesso. Você pode acompanhá-la em "Minhas Solicitações".',
        });
        navigate('/minhas-solicitacoes');
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            {editRequest ? 'Editar Solicitação' : 'Nova Solicitação'}
          </h1>
          <p className="text-muted-foreground">
            {editRequest ? 'Atualize os campos da solicitação selecionada' : 'Preencha os campos abaixo para registrar sua demanda'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display text-lg">
              Dados da Solicitação
            </CardTitle>
            <CardDescription>
              Campos marcados com * são obrigatórios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Solicitação */}
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

            {/* Órgão Solicitante */}
            <div className="space-y-2">
              <Label htmlFor="orgao">Órgão Solicitante *</Label>
              <Input
                id="orgao"
                placeholder="Ex.: Promotoria de Justiça de Teresina"
                value={formData.orgaoSolicitante}
                onChange={(e) =>
                  setFormData({ ...formData, orgaoSolicitante: e.target.value })
                }
              />
            </div>

            {/* SEI e SIMP */}
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

            {/* Assunto */}
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

            {/* Prioridade */}
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

            {/* Descrição */}
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

            {/* Anexos */}
            <div className="space-y-3">
              <Label>Anexos</Label>
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

              {/* File List */}
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
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gradient-primary border-0"
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
