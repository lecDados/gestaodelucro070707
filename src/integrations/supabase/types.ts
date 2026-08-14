export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      caixas: {
        Row: {
          aberto_em: string
          created_at: string
          fechado_em: string | null
          id: string
          observacao: string | null
          status: string
          valor_final: number | null
          valor_inicial: number
        }
        Insert: {
          aberto_em?: string
          created_at?: string
          fechado_em?: string | null
          id?: string
          observacao?: string | null
          status?: string
          valor_final?: number | null
          valor_inicial?: number
        }
        Update: {
          aberto_em?: string
          created_at?: string
          fechado_em?: string | null
          id?: string
          observacao?: string | null
          status?: string
          valor_final?: number | null
          valor_inicial?: number
        }
        Relationships: []
      }
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      compras: {
        Row: {
          created_at: string
          data: string
          fornecedor_id: string | null
          id: string
          observacao: string | null
          valor_total: number
        }
        Insert: {
          created_at?: string
          data?: string
          fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          valor_total?: number
        }
        Update: {
          created_at?: string
          data?: string
          fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          balanca_ativa: boolean
          balanca_porta: string | null
          id: number
          nome_loja: string
          updated_at: string
        }
        Insert: {
          balanca_ativa?: boolean
          balanca_porta?: string | null
          id?: number
          nome_loja?: string
          updated_at?: string
        }
        Update: {
          balanca_ativa?: boolean
          balanca_porta?: string | null
          id?: number
          nome_loja?: string
          updated_at?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          created_at: string
          documento: string | null
          endereco: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento?: string | null
          endereco?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      itens_compra: {
        Row: {
          compra_id: string
          created_at: string
          id: string
          nome_produto: string
          preco_custo: number
          produto_id: string | null
          quantidade: number
          subtotal: number
        }
        Insert: {
          compra_id: string
          created_at?: string
          id?: string
          nome_produto: string
          preco_custo: number
          produto_id?: string | null
          quantidade: number
          subtotal: number
        }
        Update: {
          compra_id?: string
          created_at?: string
          id?: string
          nome_produto?: string
          preco_custo?: number
          produto_id?: string | null
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "itens_compra_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_compra_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_venda: {
        Row: {
          created_at: string
          custo_unitario: number
          id: string
          nome_produto: string
          preco_unitario: number
          produto_id: string | null
          quantidade: number
          subtotal: number
          unidade: string
          venda_id: string
        }
        Insert: {
          created_at?: string
          custo_unitario?: number
          id?: string
          nome_produto: string
          preco_unitario: number
          produto_id?: string | null
          quantidade: number
          subtotal: number
          unidade: string
          venda_id: string
        }
        Update: {
          created_at?: string
          custo_unitario?: number
          id?: string
          nome_produto?: string
          preco_unitario?: number
          produto_id?: string | null
          quantidade?: number
          subtotal?: number
          unidade?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_venda_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_venda_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_caixa: {
        Row: {
          caixa_id: string
          created_at: string
          descricao: string | null
          id: string
          tipo: string
          valor: number
        }
        Insert: {
          caixa_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo: string
          valor: number
        }
        Update: {
          caixa_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_caixa_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          id: string
          motivo: string | null
          produto_id: string | null
          quantidade: number
          saldo_depois: number
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          motivo?: string | null
          produto_id?: string | null
          quantidade: number
          saldo_depois?: number
          tipo: string
        }
        Update: {
          created_at?: string
          id?: string
          motivo?: string | null
          produto_id?: string | null
          quantidade?: number
          saldo_depois?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      perdas: {
        Row: {
          created_at: string
          data: string
          id: string
          motivo: string
          nome_produto: string
          produto_id: string | null
          quantidade: number
          valor_estimado: number
        }
        Insert: {
          created_at?: string
          data?: string
          id?: string
          motivo: string
          nome_produto: string
          produto_id?: string | null
          quantidade: number
          valor_estimado?: number
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          motivo?: string
          nome_produto?: string
          produto_id?: string | null
          quantidade?: number
          valor_estimado?: number
        }
        Relationships: [
          {
            foreignKeyName: "perdas_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id: string
          nome?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      produtos: {
        Row: {
          ativo: boolean
          categoria_id: string | null
          created_at: string
          estoque_atual: number
          estoque_minimo: number
          fornecedor_id: string | null
          id: string
          nome: string
          preco_custo: number
          preco_venda: number
          tipo_venda: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          nome: string
          preco_custo?: number
          preco_venda?: number
          tipo_venda?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_id?: string | null
          created_at?: string
          estoque_atual?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          nome?: string
          preco_custo?: number
          preco_venda?: number
          tipo_venda?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          caixa_id: string | null
          created_at: string
          forma_pagamento: string
          id: string
          numero: number
          status: string
          total: number
          troco: number
          valor_recebido: number | null
        }
        Insert: {
          caixa_id?: string | null
          created_at?: string
          forma_pagamento: string
          id?: string
          numero?: number
          status?: string
          total?: number
          troco?: number
          valor_recebido?: number | null
        }
        Update: {
          caixa_id?: string | null
          created_at?: string
          forma_pagamento?: string
          id?: string
          numero?: number
          status?: string
          total?: number
          troco?: number
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_caixa_id_fkey"
            columns: ["caixa_id"]
            isOneToOne: false
            referencedRelation: "caixas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      registrar_movimentacao_estoque: {
        Args: {
          p_motivo: string
          p_produto: string
          p_quantidade: number
          p_tipo: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
