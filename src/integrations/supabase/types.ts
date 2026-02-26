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
      activity_log: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked_at: string | null
          scopes: string[]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          scopes?: string[]
          user_id?: string
        }
        Relationships: []
      }
      agent_demand_signals: {
        Row: {
          agent_id: string | null
          category: string | null
          created_at: string
          id: string
          max_price: number | null
          query: string
          source: string
          tech_stack: string[] | null
        }
        Insert: {
          agent_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          max_price?: number | null
          query: string
          source?: string
          tech_stack?: string[] | null
        }
        Update: {
          agent_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          max_price?: number | null
          query?: string
          source?: string
          tech_stack?: string[] | null
        }
        Relationships: []
      }
      agent_listing_views: {
        Row: {
          action: string
          agent_id: string | null
          created_at: string
          id: string
          listing_id: string
          source: string
        }
        Insert: {
          action?: string
          agent_id?: string | null
          created_at?: string
          id?: string
          listing_id: string
          source?: string
        }
        Update: {
          action?: string
          agent_id?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_webhooks: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          failure_count: number
          filters: Json
          id: string
          last_triggered_at: string | null
          secret: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          failure_count?: number
          filters?: Json
          id?: string
          last_triggered_at?: string | null
          secret: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          failure_count?: number
          filters?: Json
          id?: string
          last_triggered_at?: string | null
          secret?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      bounties: {
        Row: {
          budget: number
          category: Database["public"]["Enums"]["listing_category"]
          created_at: string
          description: string
          id: string
          poster_id: string
          status: Database["public"]["Enums"]["bounty_status"]
          submissions_count: number
          tech_stack: string[] | null
          title: string
          updated_at: string
          winner_id: string | null
          winner_listing_id: string | null
        }
        Insert: {
          budget: number
          category?: Database["public"]["Enums"]["listing_category"]
          created_at?: string
          description: string
          id?: string
          poster_id: string
          status?: Database["public"]["Enums"]["bounty_status"]
          submissions_count?: number
          tech_stack?: string[] | null
          title: string
          updated_at?: string
          winner_id?: string | null
          winner_listing_id?: string | null
        }
        Update: {
          budget?: number
          category?: Database["public"]["Enums"]["listing_category"]
          created_at?: string
          description?: string
          id?: string
          poster_id?: string
          status?: Database["public"]["Enums"]["bounty_status"]
          submissions_count?: number
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
          winner_id?: string | null
          winner_listing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bounties_winner_listing_id_fkey"
            columns: ["winner_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      bounty_submissions: {
        Row: {
          bounty_id: string
          created_at: string
          id: string
          listing_id: string
          message: string | null
          seller_id: string
          status: string
        }
        Insert: {
          bounty_id: string
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          seller_id: string
          status?: string
        }
        Update: {
          bounty_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bounty_submissions_bounty_id_fkey"
            columns: ["bounty_id"]
            isOneToOne: false
            referencedRelation: "bounties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bounty_submissions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_waitlist: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          id: string
          message: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string | null
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id?: string | null
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string | null
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_code_usage: {
        Row: {
          buyer_id: string
          discount_code_id: string
          id: string
          used_at: string
        }
        Insert: {
          buyer_id: string
          discount_code_id: string
          id?: string
          used_at?: string
        }
        Update: {
          buyer_id?: string
          discount_code_id?: string
          id?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          id?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      listing_flags: {
        Row: {
          created_at: string
          details: string | null
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_flags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_verifications: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          method: string
          status: string
          token: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          method?: string
          status?: string
          token?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          method?: string
          status?: string
          token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_verifications_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          built_with: string | null
          category: Database["public"]["Enums"]["listing_category"]
          completeness_badge: Database["public"]["Enums"]["completeness_badge"]
          created_at: string
          demo_url: string | null
          description: string
          domain_verified: boolean
          file_path: string | null
          github_url: string | null
          id: string
          price: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          remix_count: number | null
          remixed_from: string | null
          sales_count: number | null
          screenshots: string[] | null
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          tech_stack: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          built_with?: string | null
          category?: Database["public"]["Enums"]["listing_category"]
          completeness_badge?: Database["public"]["Enums"]["completeness_badge"]
          created_at?: string
          demo_url?: string | null
          description: string
          domain_verified?: boolean
          file_path?: string | null
          github_url?: string | null
          id?: string
          price: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          remix_count?: number | null
          remixed_from?: string | null
          sales_count?: number | null
          screenshots?: string[] | null
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          tech_stack?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          built_with?: string | null
          category?: Database["public"]["Enums"]["listing_category"]
          completeness_badge?: Database["public"]["Enums"]["completeness_badge"]
          created_at?: string
          demo_url?: string | null
          description?: string
          domain_verified?: boolean
          file_path?: string | null
          github_url?: string | null
          id?: string
          price?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          remix_count?: number | null
          remixed_from?: string | null
          sales_count?: number | null
          screenshots?: string[] | null
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          tech_stack?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_remixed_from_fkey"
            columns: ["remixed_from"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          buyer_id: string
          counter_amount: number | null
          created_at: string
          id: string
          listing_id: string
          message: string | null
          offer_amount: number
          original_price: number
          seller_id: string
          seller_message: string | null
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          listing_id: string
          message?: string | null
          offer_amount: number
          original_price: number
          seller_id: string
          seller_message?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          counter_amount?: number | null
          created_at?: string
          id?: string
          listing_id?: string
          message?: string | null
          offer_amount?: number
          original_price?: number
          seller_id?: string
          seller_message?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          followers_count: number | null
          following_count: number | null
          id: string
          stripe_account_id: string | null
          stripe_onboarded: boolean | null
          total_sales: number | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          id?: string
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          total_sales?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number | null
          following_count?: number | null
          id?: string
          stripe_account_id?: string | null
          stripe_onboarded?: boolean | null
          total_sales?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid: number
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          payout_transferred: boolean
          platform_fee: number
          seller_amount: number
          seller_id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          amount_paid: number
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          payout_transferred?: boolean
          platform_fee: number
          seller_amount: number
          seller_id: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          amount_paid?: number
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          payout_transferred?: boolean
          platform_fee?: number
          seller_amount?: number
          seller_id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      remix_chains: {
        Row: {
          child_listing_id: string
          created_at: string
          id: string
          parent_listing_id: string
          remixer_id: string
        }
        Insert: {
          child_listing_id: string
          created_at?: string
          id?: string
          parent_listing_id: string
          remixer_id: string
        }
        Update: {
          child_listing_id?: string
          created_at?: string
          id?: string
          parent_listing_id?: string
          remixer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "remix_chains_child_listing_id_fkey"
            columns: ["child_listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remix_chains_parent_listing_id_fkey"
            columns: ["parent_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          purchase_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          purchase_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          purchase_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      agent_popular_listings: {
        Row: {
          agent_view_count: number | null
          last_agent_view: string | null
          listing_id: string | null
          unique_agents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          id: string | null
          total_sales: number | null
          updated_at: string | null
          user_id: string | null
          username: string | null
          verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string | null
          total_sales?: number | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_sales_count: {
        Args: { listing_id_param: string }
        Returns: undefined
      }
      increment_seller_sales: {
        Args: { seller_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      bounty_status: "open" | "in_progress" | "completed" | "cancelled"
      completeness_badge: "prototype" | "mvp" | "production_ready"
      listing_category:
        | "saas_tool"
        | "ai_app"
        | "landing_page"
        | "utility"
        | "game"
        | "other"
      listing_status: "pending" | "live" | "hidden"
      pricing_type: "one_time" | "monthly"
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
      app_role: ["admin", "moderator", "user"],
      bounty_status: ["open", "in_progress", "completed", "cancelled"],
      completeness_badge: ["prototype", "mvp", "production_ready"],
      listing_category: [
        "saas_tool",
        "ai_app",
        "landing_page",
        "utility",
        "game",
        "other",
      ],
      listing_status: ["pending", "live", "hidden"],
      pricing_type: ["one_time", "monthly"],
    },
  },
} as const
