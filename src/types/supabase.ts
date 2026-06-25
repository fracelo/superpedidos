export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      advertisement: {
        Row: {
          ad_date: string
          ad_value: number
          created_at: string | null
          description: string | null
          id: number
          platform: string | null
          user_id: string | null
        }
        Insert: {
          ad_date?: string
          ad_value: number
          created_at?: string | null
          description?: string | null
          id?: number
          platform?: string | null
          user_id?: string | null
        }
        Update: {
          ad_date?: string
          ad_value?: number
          created_at?: string | null
          description?: string | null
          id?: number
          platform?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_detail: {
        Row: {
          additional_service_value: number | null
          commission_value: number | null
          created_at: string | null
          discount_sale_value: number
          id: number
          net_paid: number | null
          order_cost: number | null
          order_id: number
          product_id: number
          product_net_margin: number | null
          quantity: number
          service_fee: number | null
          total_cost: number | null
          transaction_fee_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_service_value?: number | null
          commission_value?: number | null
          created_at?: string | null
          discount_sale_value: number
          id?: number
          net_paid?: number | null
          order_cost?: number | null
          order_id: number
          product_id: number
          product_net_margin?: number | null
          quantity: number
          service_fee?: number | null
          total_cost?: number | null
          transaction_fee_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_service_value?: number | null
          commission_value?: number | null
          created_at?: string | null
          discount_sale_value?: number
          id?: number
          net_paid?: number | null
          order_cost?: number | null
          order_id?: number
          product_id?: number
          product_net_margin?: number | null
          quantity?: number
          service_fee?: number | null
          total_cost?: number | null
          transaction_fee_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_detail_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order_header"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_detail_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          }
        ]
      }
      order_header: {
        Row: {
          created_at: string | null
          customer_name: string | null
          description: string | null
          id: number
          net_margin: number | null
          order_date: string
          status: string | null
          total_additional_service: number | null
          total_commission: number | null
          total_products_value: number | null
          total_transaction_fee: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          id?: number
          net_margin?: number | null
          order_date?: string
          status?: string | null
          total_additional_service?: number | null
          total_commission?: number | null
          total_products_value?: number | null
          total_transaction_fee?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string | null
          description?: string | null
          id?: number
          net_margin?: number | null
          order_date?: string
          status?: string | null
          total_additional_service?: number | null
          total_commission?: number | null
          total_products_value?: number | null
          total_transaction_fee?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      perfil_usuario: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          documento: string | null
          email: string
          id: string
          moeda: string | null
          nome_completo: string
          nome_empresa: string | null
          status_conta: string | null
          telefone: string | null
          tema: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          documento?: string | null
          email: string
          id: string
          moeda?: string | null
          nome_completo: string
          nome_empresa?: string | null
          status_conta?: string | null
          telefone?: string | null
          tema?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          documento?: string | null
          email?: string
          id?: string
          moeda?: string | null
          nome_completo?: string
          nome_empresa?: string | null
          status_conta?: string | null
          telefone?: string | null
          tema?: string | null
        }
        Relationships: []
      }
      product: {
        Row: {
          additional_service_rate: number | null
          additional_service_value: number | null
          commission_rate: number | null
          commission_value: number | null
          created_at: string | null
          description: string
          discount_sale_value: number | null
          final_margin: number | null
          final_sale_value: number | null
          id: number
          is_active: boolean | null
          service_fee: number | null
          sku: string | null
          suggested_margin: number
          suggested_sale_value: number | null
          supplier_cost: number
          total_cost: number | null
          total_fees: number | null
          transaction_fee_rate: number | null
          transaction_fee_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          additional_service_rate?: number | null
          additional_service_value?: number | null
          commission_rate?: number | null
          commission_value?: number | null
          created_at?: string | null
          description: string
          discount_sale_value?: number | null
          final_margin?: number | null
          final_sale_value?: number | null
          id?: number
          is_active?: boolean | null
          service_fee?: number | null
          sku?: string | null
          suggested_margin?: number
          suggested_sale_value?: number | null
          supplier_cost: number
          total_cost?: number | null
          total_fees?: number | null
          transaction_fee_rate?: number | null
          transaction_fee_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          additional_service_rate?: number | null
          additional_service_value?: number | null
          commission_rate?: number | null
          commission_value?: number | null
          created_at?: string | null
          description?: string
          discount_sale_value?: number | null
          final_margin?: number | null
          final_sale_value?: number | null
          id?: number
          is_active?: boolean | null
          service_fee?: number | null
          sku?: string | null
          suggested_margin?: number
          suggested_sale_value?: number | null
          supplier_cost?: number
          total_cost?: number | null
          total_fees?: number | null
          transaction_fee_rate?: number | null
          transaction_fee_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {},
  },
} as const