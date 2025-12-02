import { useState } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { Upload, X, FileText, ArrowLeft, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

const REQUEST_TYPES: RequestType[] = [
  'Apoio aos Órgãos de Execução - 1º Grau',
  'Apoio aos Órgãos de Execução - 2º Grau',
  'Atendimento ao Público',
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export default function NovaSolicitacaoPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    orgaoSolicitante: '',
    tipoSolicitacao: '' as RequestType | '',
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
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    toast({
      title: 'Solicitação enviada!',
      description: 'Sua solicitação foi registrada com sucesso. Você pode acompanhá-la em "Minhas Solicitações".',
    });
    
    navigate('/minhas-solicitacoes');
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
            Nova Solicitação
          </h1>
          <p className="text-muted-foreground">
            Preencha os campos abaixo para registrar sua demanda
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

            {/* SEI e SIMP */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sei">Número do SEI *</Label>
                <Input
                  id="sei"
                  placeholder="Ex.: 2025.0001.000123"
                  value={formData.numeroSEI}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroSEI: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="simp">Número do SIMP</Label>
                <Input
                  id="simp"
                  placeholder="Ex.: SIMP-2025-001"
                  value={formData.numeroSIMP}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroSIMP: e.target.value })
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
