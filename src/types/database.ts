// Local database types until the auto-generated types are updated

export interface DbProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  orgao: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbUserRole {
  id: string;
  user_id: string;
  role: 'gestor' | 'requisitante';
  created_at: string;
}

export interface DbRequest {
  id: string;
  user_id: string | null;
  orgao_solicitante: string;
  tipo_solicitacao: string;
  data_solicitacao: string;
  numero_sei: string | null;
  numero_simp: string | null;
  assunto: string;
  descricao: string;
  encaminhamento: string | null;
  prioridade: string;
  status: string;
  posicao_fila: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbTimelineEvent {
  id: string;
  request_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  created_by: string | null;
}

export interface DbAttachment {
  id: string;
  request_id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}
