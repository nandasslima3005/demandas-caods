export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          orgao: string | null;
          role: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          orgao?: string | null;
          role?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          orgao?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          orgaoSolicitante: string;
          tipoSolicitacao: string;
          dataSolicitacao: string;
          numeroSEI: string;
          numeroSIMP: string | null;
          assunto: string;
          descricao: string;
          encaminhamento: string | null;
          prioridade: Database["public"]["Enums"]["priority_enum"];
          status: Database["public"]["Enums"]["status_enum"];
          posicaoFila: number | null;
          createdAt: string;
          updatedAt: string;
          createdBy: string | null;
        };
        Insert: {
          id?: string;
          orgaoSolicitante: string;
          tipoSolicitacao: string;
          dataSolicitacao: string;
          numeroSEI: string;
          numeroSIMP?: string | null;
          assunto: string;
          descricao: string;
          encaminhamento?: string | null;
          prioridade: Database["public"]["Enums"]["priority_enum"];
          status: Database["public"]["Enums"]["status_enum"];
          posicaoFila?: number | null;
          createdAt?: string;
          updatedAt?: string;
          createdBy?: string | null;
        };
        Update: {
          id?: string;
          orgaoSolicitante?: string;
          tipoSolicitacao?: string;
          dataSolicitacao?: string;
          numeroSEI?: string;
          numeroSIMP?: string | null;
          assunto?: string;
          descricao?: string;
          encaminhamento?: string | null;
          prioridade?: Database["public"]["Enums"]["priority_enum"];
          status?: Database["public"]["Enums"]["status_enum"];
          posicaoFila?: number | null;
          createdAt?: string;
          updatedAt?: string;
          createdBy?: string | null;
        };
      };
      attachments: {
        Row: {
          id: string;
          requestId: string;
          name: string;
          type: string;
          size: number;
          url: string;
          uploadedAt: string;
        };
        Insert: {
          id?: string;
          requestId: string;
          name: string;
          type: string;
          size: number;
          url: string;
          uploadedAt?: string;
        };
        Update: {
          id?: string;
          requestId?: string;
          name?: string;
          type?: string;
          size?: number;
          url?: string;
          uploadedAt?: string;
        };
      };
      timeline_events: {
        Row: {
          id: string;
          requestId: string;
          date: string;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["status_enum"];
          user: string | null;
        };
        Insert: {
          id?: string;
          requestId: string;
          date: string;
          title: string;
          description?: string | null;
          status: Database["public"]["Enums"]["status_enum"];
          user?: string | null;
        };
        Update: {
          id?: string;
          requestId?: string;
          date?: string;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["status_enum"];
          user?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      priority_enum: "baixa" | "media" | "alta" | "urgente";
      status_enum: "pendente" | "em_analise" | "em_andamento" | "aguardando_resposta" | "concluido";
    };
    CompositeTypes: Record<string, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
