export type Priority = 'baixa' | 'media' | 'alta' | 'urgente';
export type Status = 'pendente' | 'em_analise' | 'em_andamento' | 'aguardando_resposta' | 'concluido';

export type RequestType = 
  | 'Apoio aos Órgãos de Execução - 1º Grau'
  | 'Apoio aos Órgãos de Execução - 2º Grau'
  | 'Atendimento ao Público'
  | 'PGA de Políticas Públicas';

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
  'Atenção Primária à Saúde',
  'Atenção Especializada',
  'Atenção especializada - ambulatorial',
  'Atenção especializada - hospitalar',
  'Saúde Mental',
  'Saúde mental - atendimento',
  'Saúde mental - serviços',
  'Fornecimento de Medicamentos',
  'Fornecimento de Insumos',
  'Financiamento do SUS',
  'Controle Social',
  'Transporte',
  'Vigilância em Saúde',
  'Regulação - consulta e exames',
  'Regulação - hospitalar/urgência',
  'Cirurgia Eletiva',
  'Projetos',
  'Oncologia',
  'Outros',
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
