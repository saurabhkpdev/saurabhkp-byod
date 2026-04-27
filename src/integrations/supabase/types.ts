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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      custom_templates: {
        Row: {
          category: string
          client_id: string | null
          created_at: string
          description: string
          id: string
          name: string
          optional_columns: string[]
          owner_id: string
          required_columns: string[]
          sample_data: Json
          updated_at: string
        }
        Insert: {
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name: string
          optional_columns?: string[]
          owner_id: string
          required_columns?: string[]
          sample_data?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          client_id?: string | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          optional_columns?: string[]
          owner_id?: string
          required_columns?: string[]
          sample_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      data_versions: {
        Row: {
          change_summary: string | null
          column_count: number
          created_at: string
          dataset_name: string
          id: string
          row_count: number
          snapshot: Json
          user_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          column_count?: number
          created_at?: string
          dataset_name: string
          id?: string
          row_count?: number
          snapshot: Json
          user_id: string
          version_number?: number
        }
        Update: {
          change_summary?: string | null
          column_count?: number
          created_at?: string
          dataset_name?: string
          id?: string
          row_count?: number
          snapshot?: Json
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      dataset_group_shares: {
        Row: {
          dataset_version_id: string
          group_id: string
          id: string
          shared_at: string
          shared_by: string
        }
        Insert: {
          dataset_version_id: string
          group_id: string
          id?: string
          shared_at?: string
          shared_by: string
        }
        Update: {
          dataset_version_id?: string
          group_id?: string
          id?: string
          shared_at?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "dataset_group_shares_dataset_version_id_fkey"
            columns: ["dataset_version_id"]
            isOneToOne: false
            referencedRelation: "data_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dataset_group_shares_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          added_at: string
          added_by: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          last_login_at: string | null
          last_login_ip: string | null
          last_login_user_agent: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          last_login_at?: string | null
          last_login_ip?: string | null
          last_login_user_agent?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          last_login_ip?: string | null
          last_login_user_agent?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      system_template_overrides: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string | null
          optional_columns: string[] | null
          required_columns: string[] | null
          sample_data: Json | null
          system_template_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          optional_columns?: string[] | null
          required_columns?: string[] | null
          sample_data?: Json | null
          system_template_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string | null
          optional_columns?: string[] | null
          required_columns?: string[] | null
          sample_data?: Json | null
          system_template_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      template_group_shares: {
        Row: {
          group_id: string
          id: string
          shared_at: string
          shared_by: string
          template_id: string
        }
        Insert: {
          group_id: string
          id?: string
          shared_at?: string
          shared_by: string
          template_id: string
        }
        Update: {
          group_id?: string
          id?: string
          shared_at?: string
          shared_by?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_group_shares_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "template_group_shares_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "custom_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_load_configs: {
        Row: {
          allow_user_override: boolean
          auto_version: boolean
          created_at: string
          created_by: string
          id: string
          load_strategy: Database["public"]["Enums"]["load_strategy"]
          primary_key_columns: string[]
          template_id: string
          template_name: string
          updated_at: string
          validation_rules: Json
        }
        Insert: {
          allow_user_override?: boolean
          auto_version?: boolean
          created_at?: string
          created_by: string
          id?: string
          load_strategy?: Database["public"]["Enums"]["load_strategy"]
          primary_key_columns?: string[]
          template_id: string
          template_name: string
          updated_at?: string
          validation_rules?: Json
        }
        Update: {
          allow_user_override?: boolean
          auto_version?: boolean
          created_at?: string
          created_by?: string
          id?: string
          load_strategy?: Database["public"]["Enums"]["load_strategy"]
          primary_key_columns?: string[]
          template_id?: string
          template_name?: string
          updated_at?: string
          validation_rules?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      user_in_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "approver"
        | "user"
        | "sys_admin"
        | "role_admin"
        | "super_admin"
      load_strategy: "truncate_load" | "merge_upsert" | "append_only"
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
    Enums: {
      app_role: [
        "admin",
        "approver",
        "user",
        "sys_admin",
        "role_admin",
        "super_admin",
      ],
      load_strategy: ["truncate_load", "merge_upsert", "append_only"],
    },
  },
} as const
