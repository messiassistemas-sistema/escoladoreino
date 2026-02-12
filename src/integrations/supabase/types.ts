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
      announcements: {
        Row: {
          audience: string | null
          author_name: string
          content: string
          created_at: string | null
          id: string
          pinned: boolean | null
          title: string
          type: string | null
          views: number | null
        }
        Insert: {
          audience?: string | null
          author_name: string
          content: string
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          title: string
          type?: string | null
          views?: number | null
        }
        Update: {
          audience?: string | null
          author_name?: string
          content?: string
          created_at?: string | null
          id?: string
          pinned?: boolean | null
          title?: string
          type?: string | null
          views?: number | null
        }
        Relationships: []
      }
      assessments: {
        Row: {
          created_at: string | null
          date: string
          id: string
          name: string
          subject_id: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          name: string
          subject_id: string
          weight?: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          name?: string
          subject_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          status: string | null
          student_count: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          status?: string | null
          student_count?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          status?: string | null
          student_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      communication_campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          message: string
          status: string | null
          target_audience: string
          target_filter: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message: string
          status?: string | null
          target_audience: string
          target_filter?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          message?: string
          status?: string | null
          target_audience?: string
          target_filter?: string | null
          title?: string
        }
        Relationships: []
      }
      communication_queue: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          message_body: string
          phone: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          student_name: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body: string
          phone?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          student_name: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_body?: string
          phone?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          student_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "communication_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          read: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          read?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          read?: boolean | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          id: string
          price: number | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          price?: number | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_center_items: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      landing_page_content: {
        Row: {
          benefits: Json | null
          course_duration: string | null
          course_modality: string | null
          course_workload: string | null
          courses_data: Json | null
          cta_description: string | null
          cta_title: string | null
          hero_badge: string | null
          hero_description: string | null
          hero_title: string | null
          id: string
          pricing_installments: string | null
          pricing_total: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_youtube: string | null
          updated_at: string | null
        }
        Insert: {
          benefits?: Json | null
          course_duration?: string | null
          course_modality?: string | null
          course_workload?: string | null
          courses_data?: Json | null
          cta_description?: string | null
          cta_title?: string | null
          hero_badge?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          pricing_installments?: string | null
          pricing_total?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_youtube?: string | null
          updated_at?: string | null
        }
        Update: {
          benefits?: Json | null
          course_duration?: string | null
          course_modality?: string | null
          course_workload?: string | null
          courses_data?: Json | null
          cta_description?: string | null
          cta_title?: string | null
          hero_badge?: string | null
          hero_description?: string | null
          hero_title?: string | null
          id?: string
          pricing_installments?: string | null
          pricing_total?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_youtube?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          class_name: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          location: string | null
          mode: string | null
          recording_link: string | null
          release_for_presencial: boolean | null
          status: string | null
          subject_id: string | null
          teacher_name: string | null
          time: string
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          class_name?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          location?: string | null
          mode?: string | null
          recording_link?: string | null
          release_for_presencial?: boolean | null
          status?: string | null
          subject_id?: string | null
          teacher_name?: string | null
          time: string
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          class_name?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          mode?: string | null
          recording_link?: string | null
          release_for_presencial?: boolean | null
          status?: string | null
          subject_id?: string | null
          teacher_name?: string | null
          time?: string
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          author_name: string
          created_at: string | null
          downloads_count: number | null
          file_size: string | null
          file_url: string
          id: string
          subject_name: string
          title: string
          type: string | null
        }
        Insert: {
          author_name: string
          created_at?: string | null
          downloads_count?: number | null
          file_size?: string | null
          file_url: string
          id?: string
          subject_name: string
          title: string
          type?: string | null
        }
        Update: {
          author_name?: string
          created_at?: string | null
          downloads_count?: number | null
          file_size?: string | null
          file_url?: string
          id?: string
          subject_name?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          order_index: number
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          order_index: number
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          class_name: string | null
          created_at: string | null
          external_reference: string | null
          id: string
          installments: string | null
          last_updated_at: string | null
          payment_method: string | null
          payment_provider: string | null
          status: string | null
          student_email: string | null
          student_name: string
        }
        Insert: {
          amount?: number | null
          class_name?: string | null
          created_at?: string | null
          external_reference?: string | null
          id?: string
          installments?: string | null
          last_updated_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          status?: string | null
          student_email?: string | null
          student_name: string
        }
        Update: {
          amount?: number | null
          class_name?: string | null
          created_at?: string | null
          external_reference?: string | null
          id?: string
          installments?: string | null
          last_updated_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          status?: string | null
          student_email?: string | null
          student_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      student_grades: {
        Row: {
          assessment_id: string
          created_at: string | null
          grade: number | null
          id: string
          student_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          grade?: number | null
          id?: string
          student_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          grade?: number | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_grades_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          attendance_rate: number | null
          average_grade: number | null
          class_name: string | null
          created_at: string | null
          credentials_sent_at: string | null
          email: string | null
          id: string
          modality: string | null
          name: string
          phone: string | null
          registration_number: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          attendance_rate?: number | null
          average_grade?: number | null
          class_name?: string | null
          created_at?: string | null
          credentials_sent_at?: string | null
          email?: string | null
          id?: string
          modality?: string | null
          name: string
          phone?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          attendance_rate?: number | null
          average_grade?: number | null
          class_name?: string | null
          created_at?: string | null
          credentials_sent_at?: string | null
          email?: string | null
          id?: string
          modality?: string | null
          name?: string
          phone?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          teacher_name: string | null
          updated_at: string | null
          workload: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          teacher_name?: string | null
          updated_at?: string | null
          workload?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          teacher_name?: string | null
          updated_at?: string | null
          workload?: number | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          address: string | null
          admin_2fa: boolean | null
          audit_logs: boolean | null
          cash_discount: boolean | null
          cnpj: string | null
          contact_email: string | null
          contact_phone: string | null
          email_notif: boolean | null
          enrollment_value: number | null
          grade_notif: boolean | null
          id: string
          lesson_reminder: boolean | null
          logo_url: string | null
          max_installments: number | null
          min_attendance: number | null
          min_grade: number | null
          payment_api_key: string | null
          payment_provider: string | null
          portal_notif: boolean | null
          qr_validity: number | null
          school_description: string | null
          school_name: string | null
          sender_name: string | null
          smtp_host: string | null
          smtp_pass: string | null
          smtp_port: number | null
          smtp_user: string | null
          updated_at: string | null
          whatsapp_welcome_message: string | null
        }
        Insert: {
          address?: string | null
          admin_2fa?: boolean | null
          audit_logs?: boolean | null
          cash_discount?: boolean | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          email_notif?: boolean | null
          enrollment_value?: number | null
          grade_notif?: boolean | null
          id?: string
          lesson_reminder?: boolean | null
          logo_url?: string | null
          max_installments?: number | null
          min_attendance?: number | null
          min_grade?: number | null
          payment_api_key?: string | null
          payment_provider?: string | null
          portal_notif?: boolean | null
          qr_validity?: number | null
          school_description?: string | null
          school_name?: string | null
          sender_name?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
          whatsapp_welcome_message?: string | null
        }
        Update: {
          address?: string | null
          admin_2fa?: boolean | null
          audit_logs?: boolean | null
          cash_discount?: boolean | null
          cnpj?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          email_notif?: boolean | null
          enrollment_value?: number | null
          grade_notif?: boolean | null
          id?: string
          lesson_reminder?: boolean | null
          logo_url?: string | null
          max_installments?: number | null
          min_attendance?: number | null
          min_grade?: number | null
          payment_api_key?: string | null
          payment_provider?: string | null
          portal_notif?: boolean | null
          qr_validity?: number | null
          school_description?: string | null
          school_name?: string | null
          sender_name?: string | null
          smtp_host?: string | null
          smtp_pass?: string | null
          smtp_port?: number | null
          smtp_user?: string | null
          updated_at?: string | null
          whatsapp_welcome_message?: string | null
        }
        Relationships: []
      }
      teachers: {
        Row: {
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_id_by_email: { Args: { email: string }; Returns: string }
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
