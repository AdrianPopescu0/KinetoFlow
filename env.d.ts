declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL?: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string
    SUPABASE_SERVICE_ROLE_KEY?: string
    SUPABASE_SECRET_KEY?: string
    NEXT_PUBLIC_SITE_URL?: string
    TWILIO_ACCOUNT_SID?: string
    TWILIO_AUTH_TOKEN?: string
    TWILIO_WHATSAPP_FROM?: string
    WHATSAPP_CLOUD_TOKEN?: string
    WHATSAPP_CLOUD_PHONE_NUMBER_ID?: string
  }
}
