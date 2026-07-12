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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contact_form_fields: {
        Row: {
          created_at: string
          field_key: string
          field_type: string
          form_id: string
          id: string
          label_ar: string
          label_en: string
          options_json: Json
          placeholder_ar: string
          placeholder_en: string
          position: number
          required: boolean
          updated_at: string
          width: string
        }
        Insert: {
          created_at?: string
          field_key: string
          field_type: string
          form_id: string
          id?: string
          label_ar?: string
          label_en?: string
          options_json?: Json
          placeholder_ar?: string
          placeholder_en?: string
          position?: number
          required?: boolean
          updated_at?: string
          width?: string
        }
        Update: {
          created_at?: string
          field_key?: string
          field_type?: string
          form_id?: string
          id?: string
          label_ar?: string
          label_en?: string
          options_json?: Json
          placeholder_ar?: string
          placeholder_en?: string
          position?: number
          required?: boolean
          updated_at?: string
          width?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "contact_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_form_submissions: {
        Row: {
          created_at: string
          data: Json
          files: Json
          form_id: string
          id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          files?: Json
          form_id: string
          id?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          files?: Json
          form_id?: string
          id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "contact_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_forms: {
        Row: {
          created_at: string
          description_ar: string
          description_en: string
          id: string
          notify_email: string | null
          published: boolean
          slug: string
          success_message_ar: string
          success_message_en: string
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          notify_email?: string | null
          published?: boolean
          slug: string
          success_message_ar?: string
          success_message_en?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_ar?: string
          description_en?: string
          id?: string
          notify_email?: string | null
          published?: boolean
          slug?: string
          success_message_ar?: string
          success_message_en?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          file_url: string
          id: string
          title_ar: string
          title_en: string
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_url: string
          id?: string
          title_ar?: string
          title_en?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          file_url?: string
          id?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      focus_area_partners: {
        Row: {
          focus_area_id: string
          partner_id: string
        }
        Insert: {
          focus_area_id: string
          partner_id: string
        }
        Update: {
          focus_area_id?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_area_partners_focus_area_id_fkey"
            columns: ["focus_area_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_area_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_areas: {
        Row: {
          created_at: string
          gallery: Json
          hero_image: string | null
          icon: string | null
          id: string
          published: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          gallery?: Json
          hero_image?: string | null
          icon?: string | null
          id?: string
          published?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          gallery?: Json
          hero_image?: string | null
          icon?: string | null
          id?: string
          published?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      focus_areas_i18n: {
        Row: {
          description: string
          focus_area_id: string
          lang: Database["public"]["Enums"]["app_language"]
          title: string
        }
        Insert: {
          description?: string
          focus_area_id: string
          lang: Database["public"]["Enums"]["app_language"]
          title?: string
        }
        Update: {
          description?: string
          focus_area_id?: string
          lang?: Database["public"]["Enums"]["app_language"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_areas_i18n_focus_area_id_fkey"
            columns: ["focus_area_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      homepage_stats: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          sort_order: number
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          sort_order?: number
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          sort_order?: number
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      homepage_stats_i18n: {
        Row: {
          label: string
          lang: Database["public"]["Enums"]["app_language"]
          stat_id: string
        }
        Insert: {
          label?: string
          lang: Database["public"]["Enums"]["app_language"]
          stat_id: string
        }
        Update: {
          label?: string
          lang?: Database["public"]["Enums"]["app_language"]
          stat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homepage_stats_i18n_stat_id_fkey"
            columns: ["stat_id"]
            isOneToOne: false
            referencedRelation: "homepage_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string
          id: string
          label_ar: string
          label_en: string
          parent_id: string | null
          position: number
          published: boolean
          target: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label_ar?: string
          label_en?: string
          parent_id?: string | null
          position?: number
          published?: boolean
          target?: string
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          id?: string
          label_ar?: string
          label_en?: string
          parent_id?: string | null
          position?: number
          published?: boolean
          target?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          created_at: string
          gallery: Json
          hero_image: string | null
          id: string
          published: boolean
          published_at: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          gallery?: Json
          hero_image?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          gallery?: Json
          hero_image?: string | null
          id?: string
          published?: boolean
          published_at?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_i18n: {
        Row: {
          body: string
          description: string
          lang: Database["public"]["Enums"]["app_language"]
          news_id: string
          title: string
        }
        Insert: {
          body?: string
          description?: string
          lang: Database["public"]["Enums"]["app_language"]
          news_id: string
          title?: string
        }
        Update: {
          body?: string
          description?: string
          lang?: Database["public"]["Enums"]["app_language"]
          news_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_i18n_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          created_at: string
          hero_image: string | null
          id: string
          nav_order: number
          published: boolean
          show_in_nav: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_image?: string | null
          id?: string
          nav_order?: number
          published?: boolean
          show_in_nav?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_image?: string | null
          id?: string
          nav_order?: number
          published?: boolean
          show_in_nav?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      pages_i18n: {
        Row: {
          body: string
          lang: Database["public"]["Enums"]["app_language"]
          page_id: string
          seo_description: string
          seo_title: string
          title: string
        }
        Insert: {
          body?: string
          lang: Database["public"]["Enums"]["app_language"]
          page_id: string
          seo_description?: string
          seo_title?: string
          title?: string
        }
        Update: {
          body?: string
          lang?: Database["public"]["Enums"]["app_language"]
          page_id?: string
          seo_description?: string
          seo_title?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_i18n_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          show_on_home: boolean
          sort_order: number
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          show_on_home?: boolean
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          show_on_home?: boolean
          sort_order?: number
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      partners_i18n: {
        Row: {
          id: string
          lang: string
          name: string
          partner_id: string
        }
        Insert: {
          id?: string
          lang: string
          name?: string
          partner_id: string
        }
        Update: {
          id?: string
          lang?: string
          name?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_i18n_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_partners: {
        Row: {
          partner_id: string
          project_id: string
        }
        Insert: {
          partner_id: string
          project_id: string
        }
        Update: {
          partner_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_partners_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_partners_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          project_id: string
          tag_id: string
        }
        Insert: {
          project_id: string
          tag_id: string
        }
        Update: {
          project_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          focus_area_id: string | null
          gallery: Json
          hero_image: string | null
          id: string
          published: boolean
          published_at: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          focus_area_id?: string | null
          gallery?: Json
          hero_image?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          focus_area_id?: string | null
          gallery?: Json
          hero_image?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_focus_area_id_fkey"
            columns: ["focus_area_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      projects_i18n: {
        Row: {
          description: string
          lang: Database["public"]["Enums"]["app_language"]
          project_id: string
          title: string
        }
        Insert: {
          description?: string
          lang: Database["public"]["Enums"]["app_language"]
          project_id: string
          title?: string
        }
        Update: {
          description?: string
          lang?: Database["public"]["Enums"]["app_language"]
          project_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_i18n_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          accent_color: string
          contact_email: string | null
          contact_phone: string | null
          default_language: Database["public"]["Enums"]["app_language"]
          favicon_url: string | null
          head_scripts: string | null
          hero_image: string | null
          id: number
          logo_url: string | null
          map_embed_url: string | null
          primary_color: string
          seo_og_image: string | null
          show_all_sections: boolean
          show_documents: boolean
          show_focus_areas: boolean
          show_news: boolean
          show_partners: boolean
          show_projects: boolean
          show_stats: boolean
          social_links: Json
          sponsorship_url: string | null
          updated_at: string
          visitor_count_start: number
          visitor_counter_enabled: boolean
          visitor_hits: number
        }
        Insert: {
          accent_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          default_language?: Database["public"]["Enums"]["app_language"]
          favicon_url?: string | null
          head_scripts?: string | null
          hero_image?: string | null
          id?: number
          logo_url?: string | null
          map_embed_url?: string | null
          primary_color?: string
          seo_og_image?: string | null
          show_all_sections?: boolean
          show_documents?: boolean
          show_focus_areas?: boolean
          show_news?: boolean
          show_partners?: boolean
          show_projects?: boolean
          show_stats?: boolean
          social_links?: Json
          sponsorship_url?: string | null
          updated_at?: string
          visitor_count_start?: number
          visitor_counter_enabled?: boolean
          visitor_hits?: number
        }
        Update: {
          accent_color?: string
          contact_email?: string | null
          contact_phone?: string | null
          default_language?: Database["public"]["Enums"]["app_language"]
          favicon_url?: string | null
          head_scripts?: string | null
          hero_image?: string | null
          id?: number
          logo_url?: string | null
          map_embed_url?: string | null
          primary_color?: string
          seo_og_image?: string | null
          show_all_sections?: boolean
          show_documents?: boolean
          show_focus_areas?: boolean
          show_news?: boolean
          show_partners?: boolean
          show_projects?: boolean
          show_stats?: boolean
          social_links?: Json
          sponsorship_url?: string | null
          updated_at?: string
          visitor_count_start?: number
          visitor_counter_enabled?: boolean
          visitor_hits?: number
        }
        Relationships: []
      }
      site_settings_i18n: {
        Row: {
          about_body: string | null
          about_short: string
          about_title: string
          address: string
          admin_sidebar_name: string
          footer_text: string
          hero_description: string
          hero_quote: string
          hero_tagline: string
          hero_title: string
          lang: Database["public"]["Enums"]["app_language"]
          seo_description: string
          seo_title: string
          setting_id: number
          site_name: string
          sponsorship_text: string | null
          tagline: string
        }
        Insert: {
          about_body?: string | null
          about_short?: string
          about_title?: string
          address?: string
          admin_sidebar_name?: string
          footer_text?: string
          hero_description?: string
          hero_quote?: string
          hero_tagline?: string
          hero_title?: string
          lang: Database["public"]["Enums"]["app_language"]
          seo_description?: string
          seo_title?: string
          setting_id: number
          site_name?: string
          sponsorship_text?: string | null
          tagline?: string
        }
        Update: {
          about_body?: string | null
          about_short?: string
          about_title?: string
          address?: string
          admin_sidebar_name?: string
          footer_text?: string
          hero_description?: string
          hero_quote?: string
          hero_tagline?: string
          hero_title?: string
          lang?: Database["public"]["Enums"]["app_language"]
          seo_description?: string
          seo_title?: string
          setting_id?: number
          site_name?: string
          sponsorship_text?: string | null
          tagline?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_i18n_setting_id_fkey"
            columns: ["setting_id"]
            isOneToOne: false
            referencedRelation: "site_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      social_links: {
        Row: {
          created_at: string
          id: string
          platform_icon: string
          platform_name: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform_icon: string
          platform_name: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform_icon?: string
          platform_name?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          slug?: string
        }
        Relationships: []
      }
      tags_i18n: {
        Row: {
          lang: Database["public"]["Enums"]["app_language"]
          name: string
          tag_id: string
        }
        Insert: {
          lang: Database["public"]["Enums"]["app_language"]
          name?: string
          tag_id: string
        }
        Update: {
          lang?: Database["public"]["Enums"]["app_language"]
          name?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_i18n_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_visitor_count: { Args: never; Returns: number }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_language: "ar" | "en"
      app_role: "admin" | "editor" | "super_admin" | "author"
      document_category: "regulation" | "form" | "achievement"
      project_status: "planned" | "ongoing" | "completed"
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
      app_language: ["ar", "en"],
      app_role: ["admin", "editor", "super_admin", "author"],
      document_category: ["regulation", "form", "achievement"],
      project_status: ["planned", "ongoing", "completed"],
    },
  },
} as const
