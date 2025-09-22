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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      exercise_index: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          exercise_data: Json | null
          id: string
          instructions: string | null
          is_custom: boolean | null
          name: string
          subcategory: string | null
          tags: string[] | null
          tier: string | null
          time_segment: string | null
          updated_at: string
          video_url: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          exercise_data?: Json | null
          id?: string
          instructions?: string | null
          is_custom?: boolean | null
          name: string
          subcategory?: string | null
          tags?: string[] | null
          tier?: string | null
          time_segment?: string | null
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          exercise_data?: Json | null
          id?: string
          instructions?: string | null
          is_custom?: boolean | null
          name?: string
          subcategory?: string | null
          tags?: string[] | null
          tier?: string | null
          time_segment?: string | null
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          favorite_exercises: Json | null
          id: string
          last_session_date: string | null
          personal_records: Json | null
          preferences: Json | null
          total_sessions: number | null
          total_workout_time: number | null
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          favorite_exercises?: Json | null
          id?: string
          last_session_date?: string | null
          personal_records?: Json | null
          preferences?: Json | null
          total_sessions?: number | null
          total_workout_time?: number | null
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          favorite_exercises?: Json | null
          id?: string
          last_session_date?: string | null
          personal_records?: Json | null
          preferences?: Json | null
          total_sessions?: number | null
          total_workout_time?: number | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          duration_seconds: number | null
          event_data: Json
          event_type: string
          exercise_name: string | null
          id: string
          reps: number | null
          session_id: string | null
          set_number: number | null
          timestamp: string
          username: string
          weight: number | null
        }
        Insert: {
          duration_seconds?: number | null
          event_data?: Json
          event_type: string
          exercise_name?: string | null
          id?: string
          reps?: number | null
          session_id?: string | null
          set_number?: number | null
          timestamp?: string
          username: string
          weight?: number | null
        }
        Update: {
          duration_seconds?: number | null
          event_data?: Json
          event_type?: string
          exercise_name?: string | null
          id?: string
          reps?: number | null
          session_id?: string | null
          set_number?: number | null
          timestamp?: string
          username?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_analytics_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          cardio_calories: string | null
          cardio_completed: boolean | null
          cardio_time: string | null
          created_at: string
          current_phase: string
          id: string
          session_date: string
          updated_at: string
          username: string
          warmup_completed: boolean | null
          warmup_exercises_completed: boolean | null
          warmup_mood: string | null
          warmup_watched_videos: string[] | null
          workout_data: Json | null
        }
        Insert: {
          cardio_calories?: string | null
          cardio_completed?: boolean | null
          cardio_time?: string | null
          created_at?: string
          current_phase?: string
          id?: string
          session_date?: string
          updated_at?: string
          username?: string
          warmup_completed?: boolean | null
          warmup_exercises_completed?: boolean | null
          warmup_mood?: string | null
          warmup_watched_videos?: string[] | null
          workout_data?: Json | null
        }
        Update: {
          cardio_calories?: string | null
          cardio_completed?: boolean | null
          cardio_time?: string | null
          created_at?: string
          current_phase?: string
          id?: string
          session_date?: string
          updated_at?: string
          username?: string
          warmup_completed?: boolean | null
          warmup_exercises_completed?: boolean | null
          warmup_mood?: string | null
          warmup_watched_videos?: string[] | null
          workout_data?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { check_username?: string }
        Returns: boolean
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
