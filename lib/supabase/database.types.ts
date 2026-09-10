export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type ExerciseLibraryRow = {
  id: string
  title: string
  description: string | null
  notes: string | null
  region: string | null
  subcategory: string | null
  difficulty: string | null
  equipment: string | null
  position: string | null
  sets: number | null
  reps: number | null
  duration_seconds: number | null
  youtube_id: string | null
  video_url: string | null
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      exercise_library: {
        Row: ExerciseLibraryRow
        Insert: {
          id?: string
          title: string
          description?: string | null
          notes?: string | null
          region?: string | null
          subcategory?: string | null
          difficulty?: string | null
          equipment?: string | null
          position?: string | null
          sets?: number | null
          reps?: number | null
          duration_seconds?: number | null
          youtube_id?: string | null
          video_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<ExerciseLibraryRow>
        Relationships: []
      }
      patients: {
        Row: {
          id: string
          therapist_id: string
          assigned_therapist_id: string | null
          full_name: string
          email: string | null
          phone: string | null
          diagnosis: string | null
          clinical_notes: string | null
          token: string
          access_code: string | null
          created_at: string
          updated_at: string | null
          user_id: string | null
          clinic_id: string | null
          clinic_name: string | null
          notify_channel: "whatsapp" | "sms" | null
        }
        Insert: {
          id?: string
          therapist_id?: string | null
          assigned_therapist_id?: string | null
          full_name: string
          email?: string | null
          phone?: string | null
          diagnosis?: string | null
          clinical_notes?: string | null
          token?: string
          access_code?: string | null
          created_at?: string
          updated_at?: string | null
          user_id?: string | null
          clinic_id?: string | null
          clinic_name?: string | null
          notify_channel?: "whatsapp" | "sms" | null
        }
        Update: Record<string, unknown>
        Relationships: []
      }
      exercises: {
        Row: {
          id: string
          patient_id: string
          title: string
          video_url: string | null
          sets: number | null
          reps: number | null
          notes: string | null
          created_at: string
          clinic_id: string | null
        }
        Insert: {
          id?: string
          patient_id: string
          title: string
          video_url?: string | null
          sets?: number | null
          reps?: number | null
          notes?: string | null
          created_at?: string
          clinic_id?: string | null
        }
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: "exercises_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          id: string
          patient_id: string
          vas_score: number
          sleep_quality: string | null
          pain_type: string | null
          notes: string | null
          energy_level: string | null
          exercise_duration_seconds: number | null
          created_at: string
          local_date: string
        }
        Insert: {
          id?: string
          patient_id: string
          vas_score: number
          sleep_quality?: string | null
          pain_type?: string | null
          notes?: string | null
          energy_level?: string | null
          exercise_duration_seconds?: number | null
          created_at?: string
          local_date?: string
        }
        Update: Record<string, unknown>
        Relationships: []
      }
      exercise_completions: {
        Row: {
          id: string
          patient_id: string
          exercise_id: string
          local_date: string
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          exercise_id: string
          local_date: string
          completed?: boolean
          created_at?: string
        }
        Update: Record<string, unknown>
        Relationships: []
      }
      patient_push_tokens: {
        Row: {
          id: string
          patient_id: string
          token: string
          platform: string
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          token: string
          platform?: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Record<string, unknown>
        Relationships: [
          {
            foreignKeyName: "patient_push_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_profiles: {
        Row: {
          id: string
          user_id: string
          clinic_name: string
          therapist_name: string
          phone: string | null
          role: string | null
        }
        Insert: {
          id?: string
          user_id: string
          clinic_name: string
          therapist_name: string
          phone?: string | null
          role?: string | null
        }
        Update: Record<string, unknown>
        Relationships: []
      }
      therapist_invites: {
        Row: {
          id: string
          token: string
          clinic_name: string
          clinic_owner_id: string
          invited_by: string
          therapist_name: string
          phone: string
          email: string | null
          expires_at: string
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          token: string
          clinic_name: string
          clinic_owner_id: string
          invited_by: string
          therapist_name: string
          phone: string
          email?: string | null
          expires_at: string
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
        }
        Update: Record<string, unknown>
        Relationships: []
      }
      support_tickets: {
        Row: {
          id: string
          name: string
          contact: string
          message: string
          created_at: string
          status: string | null
        }
        Insert: {
          id?: string
          name: string
          contact: string
          message: string
          created_at?: string
          status?: string | null
        }
        Update: Record<string, unknown>
        Relationships: []
      }
      auth_email_otps: {
        Row: {
          id: string
          email: string
          code_hash: string
          link_token_hash: string
          purpose: "login" | "register"
          expires_at: string
          consumed_at: string | null
          attempt_count: number
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          code_hash: string
          link_token_hash: string
          purpose: "login" | "register"
          expires_at: string
          consumed_at?: string | null
          attempt_count?: number
          created_at?: string
        }
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_exercise_library_editor: {
        Args: Record<string, never>
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
