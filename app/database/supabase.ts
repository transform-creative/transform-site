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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      auth_clients: {
        Row: {
          asoc_business: number | null
          created_at: string
          name: string | null
          user_id: string
        }
        Insert: {
          asoc_business?: number | null
          created_at?: string
          name?: string | null
          user_id?: string
        }
        Update: {
          asoc_business?: number | null
          created_at?: string
          name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_clients_asoc_business_fkey"
            columns: ["asoc_business"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_imports: {
        Row: {
          created_at: string
          id: number
          import_type: string
          is_deleted: boolean
          num_rows: number | null
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          import_type: string
          is_deleted?: boolean
          num_rows?: number | null
          success?: boolean
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: number
          import_type?: string
          is_deleted?: boolean
          num_rows?: number | null
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          abn: string | null
          account_name: string | null
          account_num: string | null
          ai_autofix_enabled: boolean
          bsb_num: string | null
          created_at: string
          default_invoice: number | null
          details_complete: boolean
          email: string | null
          github_default_branch: string
          github_repo: string | null
          id: number
          integrations: Json
          invoice_color: string
          invoice_count: number
          invoice_prefix: string
          invoice_reset_monthly: boolean
          invoice_show_client_details: boolean
          invoice_show_description: boolean
          invoice_show_due: boolean
          invoice_show_gst: boolean
          invoice_show_location: boolean
          invoice_show_outstanding: boolean
          invoice_show_total_paid: boolean
          logo: string | null
          name: string | null
          pay_id: string | null
          phone: string | null
          postcode: string | null
          profile: string | null
          quote_color: string
          quote_id: number
          rate: number
          state: string | null
          street: string | null
          street_number: number | null
          suburb: string | null
          user_id: string | null
        }
        Insert: {
          abn?: string | null
          account_name?: string | null
          account_num?: string | null
          ai_autofix_enabled?: boolean
          bsb_num?: string | null
          created_at?: string
          default_invoice?: number | null
          details_complete?: boolean
          email?: string | null
          github_default_branch?: string
          github_repo?: string | null
          id?: number
          integrations?: Json
          invoice_color?: string
          invoice_count?: number
          invoice_prefix?: string
          invoice_reset_monthly?: boolean
          invoice_show_client_details?: boolean
          invoice_show_description?: boolean
          invoice_show_due?: boolean
          invoice_show_gst?: boolean
          invoice_show_location?: boolean
          invoice_show_outstanding?: boolean
          invoice_show_total_paid?: boolean
          logo?: string | null
          name?: string | null
          pay_id?: string | null
          phone?: string | null
          postcode?: string | null
          profile?: string | null
          quote_color?: string
          quote_id?: number
          rate?: number
          state?: string | null
          street?: string | null
          street_number?: number | null
          suburb?: string | null
          user_id?: string | null
        }
        Update: {
          abn?: string | null
          account_name?: string | null
          account_num?: string | null
          ai_autofix_enabled?: boolean
          bsb_num?: string | null
          created_at?: string
          default_invoice?: number | null
          details_complete?: boolean
          email?: string | null
          github_default_branch?: string
          github_repo?: string | null
          id?: number
          integrations?: Json
          invoice_color?: string
          invoice_count?: number
          invoice_prefix?: string
          invoice_reset_monthly?: boolean
          invoice_show_client_details?: boolean
          invoice_show_description?: boolean
          invoice_show_due?: boolean
          invoice_show_gst?: boolean
          invoice_show_location?: boolean
          invoice_show_outstanding?: boolean
          invoice_show_total_paid?: boolean
          logo?: string | null
          name?: string | null
          pay_id?: string | null
          phone?: string | null
          postcode?: string | null
          profile?: string | null
          quote_color?: string
          quote_id?: number
          rate?: number
          state?: string | null
          street?: string | null
          street_number?: number | null
          suburb?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_profile_fkey"
            columns: ["profile"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: number
          import_id: number | null
          name: string | null
          nickname: string | null
          phone: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
          import_id?: number | null
          name?: string | null
          nickname?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
          import_id?: number | null
          name?: string | null
          nickname?: string | null
          phone?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bulk_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      clients_to_businesses: {
        Row: {
          auth_client_id: string | null
          business_id: number | null
          created_at: string
          id: number
        }
        Insert: {
          auth_client_id?: string | null
          business_id?: number | null
          created_at?: string
          id?: number
        }
        Update: {
          auth_client_id?: string | null
          business_id?: number | null
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "clients_to_businesses_auth_client_id_fkey"
            columns: ["auth_client_id"]
            isOneToOne: false
            referencedRelation: "auth_clients"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "clients_to_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          dynamic_fields: Json
          id: number
          label: string | null
          ops: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dynamic_fields?: Json
          id?: number
          label?: string | null
          ops?: Json | null
          user_id?: string
        }
        Update: {
          created_at?: string
          dynamic_fields?: Json
          id?: number
          label?: string | null
          ops?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          date: string | null
          description: string | null
          file: string | null
          id: number
          import_id: number | null
          is_deductible: boolean
          project_id: number | null
          recurring_id: number | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          file?: string | null
          id?: number
          import_id?: number | null
          is_deductible?: boolean
          project_id?: number | null
          recurring_id?: number | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          file?: string | null
          id?: number
          import_id?: number | null
          is_deductible?: boolean
          project_id?: number | null
          recurring_id?: number | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bulk_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_recurring_id_fkey"
            columns: ["recurring_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          category: string | null
          created_at: string
          id: number
          user_id: string
          value: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: number
          user_id?: string
          value?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: number
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          contract_id: number | null
          created_at: string
          date: string
          date_paid: string | null
          description: string | null
          due_date: string | null
          id: number
          import_id: number | null
          invoice_items: Json | null
          invoice_number: string
          is_paid: boolean
          isInvoice: boolean | null
          items: string[] | null
          location: string | null
          message: string | null
          outstanding_balance: number | null
          project_id: number | null
          show_gst: boolean
          total_amount: number
          total_paid: number | null
          user_id: string | null
        }
        Insert: {
          contract_id?: number | null
          created_at?: string
          date: string
          date_paid?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          import_id?: number | null
          invoice_items?: Json | null
          invoice_number: string
          is_paid?: boolean
          isInvoice?: boolean | null
          items?: string[] | null
          location?: string | null
          message?: string | null
          outstanding_balance?: number | null
          project_id?: number | null
          show_gst?: boolean
          total_amount: number
          total_paid?: number | null
          user_id?: string | null
        }
        Update: {
          contract_id?: number | null
          created_at?: string
          date?: string
          date_paid?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          import_id?: number | null
          invoice_items?: Json | null
          invoice_number?: string
          is_paid?: boolean
          isInvoice?: boolean | null
          items?: string[] | null
          location?: string | null
          message?: string | null
          outstanding_balance?: number | null
          project_id?: number | null
          show_gst?: boolean
          total_amount?: number
          total_paid?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bulk_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_comments: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          edited_at: string | null
          id: number
          issue_id: number
        }
        Insert: {
          author_user_id?: string
          body: string
          created_at?: string
          edited_at?: string | null
          id?: number
          issue_id: number
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          edited_at?: string | null
          id?: number
          issue_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "issue_comments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          ai_attempts: number
          ai_branch: string | null
          ai_error: string | null
          ai_pr_number: number | null
          ai_pr_url: string | null
          ai_run_id: string | null
          ai_status: string | null
          ai_updated_at: string | null
          approved_at: string | null
          business_id: number | null
          client_id: string
          created_at: string
          description: string | null
          id: number
          issue_type: string | null
          more_info: string | null
          rejected_at: string | null
          severity: string | null
          started_at: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          ai_attempts?: number
          ai_branch?: string | null
          ai_error?: string | null
          ai_pr_number?: number | null
          ai_pr_url?: string | null
          ai_run_id?: string | null
          ai_status?: string | null
          ai_updated_at?: string | null
          approved_at?: string | null
          business_id?: number | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: number
          issue_type?: string | null
          more_info?: string | null
          rejected_at?: string | null
          severity?: string | null
          started_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_attempts?: number
          ai_branch?: string | null
          ai_error?: string | null
          ai_pr_number?: number | null
          ai_pr_url?: string | null
          ai_run_id?: string | null
          ai_status?: string | null
          ai_updated_at?: string | null
          approved_at?: string | null
          business_id?: number | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: number
          issue_type?: string | null
          more_info?: string | null
          rejected_at?: string | null
          severity?: string | null
          started_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issues_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          bcc: string | null
          cc: string | null
          created: string | null
          deliveryresult: Json | null
          deliverysignature: Json | null
          html_body: string | null
          id: string
          log: Json | null
          recipient: string | null
          sender: string | null
          status: string | null
          subject: string | null
          template: string | null
          text_body: string | null
        }
        Insert: {
          bcc?: string | null
          cc?: string | null
          created?: string | null
          deliveryresult?: Json | null
          deliverysignature?: Json | null
          html_body?: string | null
          id?: string
          log?: Json | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          subject?: string | null
          template?: string | null
          text_body?: string | null
        }
        Update: {
          bcc?: string | null
          cc?: string | null
          created?: string | null
          deliveryresult?: Json | null
          deliverysignature?: Json | null
          html_body?: string | null
          id?: string
          log?: Json | null
          recipient?: string | null
          sender?: string | null
          status?: string | null
          subject?: string | null
          template?: string | null
          text_body?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string
          id: number
          notes_delta: Json[]
          project_id: number
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          notes_delta?: Json[]
          project_id: number
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          notes_delta?: Json[]
          project_id?: number
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          data: Json | null
          description: string | null
          id: number
          is_live: boolean
          slug: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: number
          is_live?: boolean
          slug: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: number
          is_live?: boolean
          slug?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allow_email: boolean
          avatar_url: string | null
          default_settings: Json
          email: string | null
          first_name: string | null
          full_name: string | null
          google_access_token: Json | null
          id: string
          integration_settings: Json
          last_name: string | null
          new_features_read: boolean
          provider_refresh_token: Json | null
          role: Database["public"]["Enums"]["roles"]
          updated_at: string | null
          user_name: string | null
        }
        Insert: {
          allow_email?: boolean
          avatar_url?: string | null
          default_settings?: Json
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          google_access_token?: Json | null
          id: string
          integration_settings?: Json
          last_name?: string | null
          new_features_read?: boolean
          provider_refresh_token?: Json | null
          role?: Database["public"]["Enums"]["roles"]
          updated_at?: string | null
          user_name?: string | null
        }
        Update: {
          allow_email?: boolean
          avatar_url?: string | null
          default_settings?: Json
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          google_access_token?: Json | null
          id?: string
          integration_settings?: Json
          last_name?: string | null
          new_features_read?: boolean
          provider_refresh_token?: Json | null
          role?: Database["public"]["Enums"]["roles"]
          updated_at?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      profiles_to_businesses: {
        Row: {
          business_id: number | null
          created_at: string
          id: number
          profile_id: string | null
          role: string | null
        }
        Insert: {
          business_id?: number | null
          created_at?: string
          id?: number
          profile_id?: string | null
          role?: string | null
        }
        Update: {
          business_id?: number | null
          created_at?: string
          id?: number
          profile_id?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_to_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_to_businesses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: number | null
          created_at: string
          delivery_date: string | null
          documents: Json | null
          id: number
          import_id: number | null
          is_complete: boolean
          name: string | null
          next_due: string | null
          notes: Json[] | null
          notes_delta: Json[] | null
          notes_multi: Json
          priority: number | null
          project_date: Json
          project_delivery_date: Json
          shoot_date: string | null
          start_end: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          client_id?: number | null
          created_at?: string
          delivery_date?: string | null
          documents?: Json | null
          id?: number
          import_id?: number | null
          is_complete?: boolean
          name?: string | null
          next_due?: string | null
          notes?: Json[] | null
          notes_delta?: Json[] | null
          notes_multi?: Json
          priority?: number | null
          project_date?: Json
          project_delivery_date?: Json
          shoot_date?: string | null
          start_end?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: number | null
          created_at?: string
          delivery_date?: string | null
          documents?: Json | null
          id?: number
          import_id?: number | null
          is_complete?: boolean
          name?: string | null
          next_due?: string | null
          notes?: Json[] | null
          notes_delta?: Json[] | null
          notes_multi?: Json
          priority?: number | null
          project_date?: Json
          project_delivery_date?: Json
          shoot_date?: string | null
          start_end?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_clientID_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bulk_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          created_at: string
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurring_options"]
          id: number
          start_date: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurring_options"]
          id?: number
          start_date?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurring_options"]
          id?: number
          start_date?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_recurring_expense: { Args: never; Returns: string }
      bytea_to_text: { Args: { data: string }; Returns: string }
      change_user_role: { Args: { input_role: string }; Returns: string }
      client_belongs_to_business: {
        Args: { p_business_id: number; p_client_id: string }
        Returns: boolean
      }
      current_user_owns_business: {
        Args: { p_business_id: number }
        Returns: boolean
      }
      email_activity: { Args: never; Returns: string }
      get_active_subscriptions: {
        Args: { _user_id: string }
        Returns: {
          attrs: Json
          currency: string
          current_period_end: string
          current_period_start: string
          customer: string
          id: string
        }[]
      }
      get_new_stripe_subscription: {
        Args: { subscription_id: string }
        Returns: Json
      }
      get_stripe_customer: {
        Args: { id_search: string }
        Returns: {
          attrs: Json
          created: string
          description: string
          email: string
          id: string
          name: string
        }[]
      }
      get_stripe_intent: {
        Args: { id_search: string }
        Returns: {
          amount: number
          attrs: Json
          created: string
          currency: string
          customer: string
          id: string
          payment_method: string
        }[]
      }
      get_stripe_payment_intents: {
        Args: { _uid: string }
        Returns: {
          amount: number
          attrs: Json
          created: string
          currency: string
          customer: string
          id: string
          payment_method: string
        }[]
      }
      get_stripe_products: {
        Args: { name_prefix: string }
        Returns: {
          active: boolean
          default_price: string
          description: string
          id: string
          name: string
        }[]
      }
      get_stripe_subscription: {
        Args: { sub_id: string }
        Returns: {
          attrs: Json
          currency: string
          current_period_end: string
          current_period_start: string
          customer: string
          id: string
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_invoice_count: { Args: { row_id: number }; Returns: undefined }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      reset_invoice_count: { Args: { row_id: number }; Returns: undefined }
      send_email_message: { Args: { message: Json }; Returns: Json }
      send_email_sendgrid: { Args: { message: Json }; Returns: Json }
      send_subscription_confirmation: {
        Args: { _pln: string; _usr: string }
        Returns: string
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      try_email_errors: { Args: never; Returns: string }
      update_user_role_to_basic_subscriber: {
        Args: { _id: string }
        Returns: boolean
      }
      update_user_role_to_free: { Args: { _id: string }; Returns: boolean }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      user_exists: { Args: { id_of_user: string }; Returns: number }
    }
    Enums: {
      recurring_options:
        | "never"
        | "daily"
        | "weekly"
        | "monthly"
        | "quarterly"
        | "annually"
        | "fortnightly"
      roles: "free" | "basic_subscriber" | "advanced_subscriber" | "admin"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
      rec_expense: {
        rec_id: number | null
        last_insert: string | null
        description: string | null
        category: string | null
        amount: number | null
        is_deductible: boolean | null
        url: string | null
      }
      rec_row: {
        rec_id: number | null
        last_insert: string | null
        description: string | null
        category: string | null
        amount: number | null
        is_deductible: boolean | null
        url: string | null
      }
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
      recurring_options: [
        "never",
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "annually",
        "fortnightly",
      ],
      roles: ["free", "basic_subscriber", "advanced_subscriber", "admin"],
    },
  },
} as const
