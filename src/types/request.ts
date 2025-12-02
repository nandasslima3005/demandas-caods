export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type Status = 'pendente' | 'em_analise' | 'em_andamento' | 'aguardando_resposta' | 'concluido';

export type RequestType = 
  | 'Apoio aos Órgãos de Execução - 1º Grau'
  | 'Apoio aos Órgãos de Execução - 2º Grau'
  | 'Atendimento ao Público';

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  status: Status;
  user?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export interface Request {
  id: string;
  orgaoSolicitante: string;
  tipoSolicitacao: RequestType;
  dataSolicitacao: string;
  numeroSEI: string;
  numeroSIMP?: string;
  assunto: string;
  descricao: string;
  encaminhamento?: string;
  prioridade: Priority;
  status: Status;
  anexos: Attachment[];
  timeline: TimelineEvent[];
  posicaoFila?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  pendentes: number;
  emAnalise: number;
  emAndamento: number;
  concluidos: number;
  urgentes: number;
}

export const ASSUNTOS_CNMP = [
  'Acesso à Saúde',
  'Atenção Básica',
  'Atenção Especializada',
  'Assistência Farmacêutica',
  'Auditoria em Saúde',
  'Controle Social',
  'Educação em Saúde',
  'Epidemiologia',
  'Financiamento da Saúde',
  'Gestão do SUS',
  'Humanização',
  'Judicialização da Saúde',
  'Medicamentos',
  'Planos de Saúde',
  'Política de Saúde',
  'Regulação em Saúde',
  'Saúde Bucal',
  'Saúde da Criança',
  'Saúde da Família',
  'Saúde da Mulher',
  'Saúde do Idoso',
  'Saúde do Trabalhador',
  'Saúde Mental',
  'Vigilância Sanitária',
  'Vigilância Epidemiológica',
];

export const STATUS_LABELS: Record<Status, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  em_andamento: 'Em Andamento',
  aguardando_resposta: 'Aguardando Resposta',
  concluido: 'Concluído',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};
