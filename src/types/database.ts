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
      aag_part_prices: {
        Row: {
          fetched_at: string
          genart_id: number
          offers: Json
          reg: string
          state: string
        }
        Insert: {
          fetched_at?: string
          genart_id: number
          offers?: Json
          reg: string
          state: string
        }
        Update: {
          fetched_at?: string
          genart_id?: number
          offers?: Json
          reg?: string
          state?: string
        }
        Relationships: []
      }
      account_deletions: {
        Row: {
          addresses_deleted: number
          bookings_scrubbed: number
          created_at: string
          credits_deleted: number
          id: string
          inbox_reads_deleted: number
          ip: string | null
          push_tokens_deleted: number
          reminders_deleted: number
          source: string
          user_id: string
          vehicles_deleted: number
        }
        Insert: {
          addresses_deleted?: number
          bookings_scrubbed?: number
          created_at?: string
          credits_deleted?: number
          id?: string
          inbox_reads_deleted?: number
          ip?: string | null
          push_tokens_deleted?: number
          reminders_deleted?: number
          source: string
          user_id: string
          vehicles_deleted?: number
        }
        Update: {
          addresses_deleted?: number
          bookings_scrubbed?: number
          created_at?: string
          credits_deleted?: number
          id?: string
          inbox_reads_deleted?: number
          ip?: string | null
          push_tokens_deleted?: number
          reminders_deleted?: number
          source?: string
          user_id?: string
          vehicles_deleted?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_deletions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_deletions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_rate_limits: {
        Row: {
          bucket: string
          count: number
          expires_at: string
          subject: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          expires_at: string
          subject: string
          window_start: string
        }
        Update: {
          bucket?: string
          count?: number
          expires_at?: string
          subject?: string
          window_start?: string
        }
        Relationships: []
      }
      areas: {
        Row: {
          acquisition_budget_pence: number | null
          created_at: string
          id: string
          is_active: boolean
          labour_multiplier: number
          launch_checklist: Json
          name: string
          postcode_prefixes: string[]
          recruitment_blurb: string | null
          recruitment_headline: string | null
          referral_code: string | null
          slug: string | null
          status: string
          target_mechanic_count: number | null
          updated_at: string
        }
        Insert: {
          acquisition_budget_pence?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          labour_multiplier?: number
          launch_checklist?: Json
          name: string
          postcode_prefixes?: string[]
          recruitment_blurb?: string | null
          recruitment_headline?: string | null
          referral_code?: string | null
          slug?: string | null
          status?: string
          target_mechanic_count?: number | null
          updated_at?: string
        }
        Update: {
          acquisition_budget_pence?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          labour_multiplier?: number
          launch_checklist?: Json
          name?: string
          postcode_prefixes?: string[]
          recruitment_blurb?: string | null
          recruitment_headline?: string | null
          referral_code?: string | null
          slug?: string | null
          status?: string
          target_mechanic_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      booking_checklist_results: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          item_id: string
          result: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          item_id: string
          result: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          item_id?: string
          result?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_checklist_results_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checklist_results_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checklist_results_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_checklist_results_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          booking_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
          reason: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          booking_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          reason?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          booking_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_faults: {
        Row: {
          booking_id: string
          created_at: string
          description: string
          id: string
          mechanic_id: string
          quote_id: string | null
          severity: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          description: string
          id?: string
          mechanic_id: string
          quote_id?: string | null
          severity?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          description?: string
          id?: string
          mechanic_id?: string
          quote_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_faults_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_faults_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_faults_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_faults_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "job_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_media: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          kind: string
          mechanic_id: string
          storage_path: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          kind: string
          mechanic_id: string
          storage_path: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          kind?: string
          mechanic_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_media_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_media_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_media_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_parts: {
        Row: {
          booking_id: string
          brand: string | null
          created_at: string
          delivered_at: string | null
          genart_id: number | null
          id: string
          node_id: string | null
          ordered_at: string | null
          part_id: string | null
          part_name: string
          priced_at: string | null
          quantity: number
          source: string
          sourcing: string
          status: string
          supplier: string | null
          supplier_part_number: string | null
          total_pence: number
          unit_price_pence: number
        }
        Insert: {
          booking_id: string
          brand?: string | null
          created_at?: string
          delivered_at?: string | null
          genart_id?: number | null
          id?: string
          node_id?: string | null
          ordered_at?: string | null
          part_id?: string | null
          part_name: string
          priced_at?: string | null
          quantity?: number
          source?: string
          sourcing?: string
          status?: string
          supplier?: string | null
          supplier_part_number?: string | null
          total_pence: number
          unit_price_pence: number
        }
        Update: {
          booking_id?: string
          brand?: string | null
          created_at?: string
          delivered_at?: string | null
          genart_id?: number | null
          id?: string
          node_id?: string | null
          ordered_at?: string | null
          part_id?: string | null
          part_name?: string
          priced_at?: string | null
          quantity?: number
          source?: string
          sourcing?: string
          status?: string
          supplier?: string | null
          supplier_part_number?: string | null
          total_pence?: number
          unit_price_pence?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_parts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_repairs: {
        Row: {
          booking_id: string
          charged_hours: number
          created_at: string
          description: string
          id: string
          item_id: string | null
          item_label: string | null
          kind: string
          line_pence: number
          node_id: string
          position: number
          raw_hours: number
        }
        Insert: {
          booking_id: string
          charged_hours: number
          created_at?: string
          description: string
          id?: string
          item_id?: string | null
          item_label?: string | null
          kind?: string
          line_pence: number
          node_id: string
          position: number
          raw_hours: number
        }
        Update: {
          booking_id?: string
          charged_hours?: number
          created_at?: string
          description?: string
          id?: string
          item_id?: string | null
          item_label?: string | null
          kind?: string
          line_pence?: number
          node_id?: string
          position?: number
          raw_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_repairs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          area: string | null
          area_id: string | null
          base_price_pence: number | null
          cancellation_reason: string | null
          candidate_days: string[] | null
          combine_source: string | null
          commission_rate: number
          completed_at: string | null
          created_at: string
          credit_applied_pence: number
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_pence: number
          duration_source: string | null
          en_route_at: string | null
          engine_oil_litres: number | null
          engine_oil_price_per_litre_pence: number | null
          engine_oil_source: string | null
          hourly_rate_pence: number | null
          id: string
          job_number: number | null
          labour_multiplier: number | null
          mechanic_id: string | null
          mechanic_payout_pence: number | null
          mileage: number | null
          parking_type: string | null
          parts_price_pence: number
          payment_mode: string
          platform_fee_pence: number | null
          postcode: string
          preferred_mechanic_id: string | null
          promo_code: string | null
          repair_description: string | null
          repair_node_id: string | null
          reschedule_note: string | null
          reschedule_proposed_at: string | null
          reschedule_status: string | null
          scheduled_at: string | null
          service_duration_hours: number | null
          slot_window: string | null
          source_quote_id: string | null
          special_instructions: string | null
          started_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_method_id: string | null
          stripe_setup_intent_id: string | null
          total_pence: number
          updated_at: string
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_raw_duration_hours: number | null
          vehicle_reg: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          area?: string | null
          area_id?: string | null
          base_price_pence?: number | null
          cancellation_reason?: string | null
          candidate_days?: string[] | null
          combine_source?: string | null
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          credit_applied_pence?: number
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_pence?: number
          duration_source?: string | null
          en_route_at?: string | null
          engine_oil_litres?: number | null
          engine_oil_price_per_litre_pence?: number | null
          engine_oil_source?: string | null
          hourly_rate_pence?: number | null
          id?: string
          job_number?: number | null
          labour_multiplier?: number | null
          mechanic_id?: string | null
          mechanic_payout_pence?: number | null
          mileage?: number | null
          parking_type?: string | null
          parts_price_pence?: number
          payment_mode?: string
          platform_fee_pence?: number | null
          postcode: string
          preferred_mechanic_id?: string | null
          promo_code?: string | null
          repair_description?: string | null
          repair_node_id?: string | null
          reschedule_note?: string | null
          reschedule_proposed_at?: string | null
          reschedule_status?: string | null
          scheduled_at?: string | null
          service_duration_hours?: number | null
          slot_window?: string | null
          source_quote_id?: string | null
          special_instructions?: string | null
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          total_pence: number
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_raw_duration_hours?: number | null
          vehicle_reg: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          area?: string | null
          area_id?: string | null
          base_price_pence?: number | null
          cancellation_reason?: string | null
          candidate_days?: string[] | null
          combine_source?: string | null
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          credit_applied_pence?: number
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_pence?: number
          duration_source?: string | null
          en_route_at?: string | null
          engine_oil_litres?: number | null
          engine_oil_price_per_litre_pence?: number | null
          engine_oil_source?: string | null
          hourly_rate_pence?: number | null
          id?: string
          job_number?: number | null
          labour_multiplier?: number | null
          mechanic_id?: string | null
          mechanic_payout_pence?: number | null
          mileage?: number | null
          parking_type?: string | null
          parts_price_pence?: number
          payment_mode?: string
          platform_fee_pence?: number | null
          postcode?: string
          preferred_mechanic_id?: string | null
          promo_code?: string | null
          repair_description?: string | null
          repair_node_id?: string | null
          reschedule_note?: string | null
          reschedule_proposed_at?: string | null
          reschedule_status?: string | null
          scheduled_at?: string | null
          service_duration_hours?: number | null
          slot_window?: string | null
          source_quote_id?: string | null
          special_instructions?: string | null
          started_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          total_pence?: number
          updated_at?: string
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_raw_duration_hours?: number | null
          vehicle_reg?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_preferred_mechanic_id_fkey"
            columns: ["preferred_mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_preferred_mechanic_id_fkey"
            columns: ["preferred_mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_source_quote_id_fkey"
            columns: ["source_quote_id"]
            isOneToOne: false
            referencedRelation: "job_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_products: {
        Row: {
          category: string
          checklist_id: string | null
          checklist_tier: string | null
          created_at: string
          description: string | null
          display_order: number
          duration_hours: number
          id: string
          includes_engine_oil: boolean
          is_active: boolean
          labour_hours: number | null
          name: string
          price_pence: number | null
          summary: string | null
          updated_at: string
        }
        Insert: {
          category: string
          checklist_id?: string | null
          checklist_tier?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_hours?: number
          id?: string
          includes_engine_oil?: boolean
          is_active?: boolean
          labour_hours?: number | null
          name: string
          price_pence?: number | null
          summary?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          checklist_id?: string | null
          checklist_tier?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          duration_hours?: number
          id?: string
          includes_engine_oil?: boolean
          is_active?: boolean
          labour_hours?: number | null
          name?: string
          price_pence?: number | null
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_products_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          position: number
          section: string
          tiers: string[] | null
          updated_at: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          position?: number
          section?: string
          tiers?: string[] | null
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          position?: number
          section?: string
          tiers?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          created_at: string
          id: string
          key: string
          kind: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          kind: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          kind?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          address_line_1: string
          address_line_2: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          kind: string
          label: string
          note: string | null
          parking_type: string | null
          postcode: string
          special_instructions: string | null
          updated_at: string
        }
        Insert: {
          address_line_1: string
          address_line_2?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          kind?: string
          label: string
          note?: string | null
          parking_type?: string | null
          postcode: string
          special_instructions?: string | null
          updated_at?: string
        }
        Update: {
          address_line_1?: string
          address_line_2?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          kind?: string
          label?: string
          note?: string | null
          parking_type?: string | null
          postcode?: string
          special_instructions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_credits: {
        Row: {
          amount_pence: number
          created_at: string
          customer_id: string
          description: string | null
          expires_at: string | null
          id: string
          redeemed_at: string | null
          redeemed_booking_id: string | null
          source: string
        }
        Insert: {
          amount_pence: number
          created_at?: string
          customer_id: string
          description?: string | null
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_booking_id?: string | null
          source: string
        }
        Update: {
          amount_pence?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_booking_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_credits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_credits_redeemed_booking_id_fkey"
            columns: ["redeemed_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_inbox_reads: {
        Row: {
          customer_id: string
          read_before: string | null
          read_ids: string[]
          updated_at: string
        }
        Insert: {
          customer_id: string
          read_before?: string | null
          read_ids?: string[]
          updated_at?: string
        }
        Update: {
          customer_id?: string
          read_before?: string | null
          read_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_inbox_reads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_inbox_reads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_push_tokens: {
        Row: {
          created_at: string
          customer_id: string
          last_seen_at: string
          platform: string
          token: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          last_seen_at?: string
          platform: string
          token: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          last_seen_at?: string
          platform?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_push_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_push_tokens_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_vehicles: {
        Row: {
          colour: string | null
          created_at: string
          customer_id: string
          details_checked_at: string | null
          fuel_type: string | null
          id: string
          make: string | null
          model: string | null
          mot_expiry_date: string | null
          mot_status: string | null
          nickname: string | null
          registration: string
          tax_due_date: string | null
          tax_status: string | null
          updated_at: string
          year_of_manufacture: number | null
        }
        Insert: {
          colour?: string | null
          created_at?: string
          customer_id: string
          details_checked_at?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          model?: string | null
          mot_expiry_date?: string | null
          mot_status?: string | null
          nickname?: string | null
          registration: string
          tax_due_date?: string | null
          tax_status?: string | null
          updated_at?: string
          year_of_manufacture?: number | null
        }
        Update: {
          colour?: string | null
          created_at?: string
          customer_id?: string
          details_checked_at?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          model?: string | null
          mot_expiry_date?: string | null
          mot_status?: string | null
          nickname?: string | null
          registration?: string
          tax_due_date?: string | null
          tax_status?: string | null
          updated_at?: string
          year_of_manufacture?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_vehicles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          body: string
          created_at: string
          dispute_id: string
          id: string
          photos: string[]
          sender_id: string | null
          sender_role: string
          visible_to: string | null
        }
        Insert: {
          body: string
          created_at?: string
          dispute_id: string
          id?: string
          photos?: string[]
          sender_id?: string | null
          sender_role: string
          visible_to?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
          photos?: string[]
          sender_id?: string | null
          sender_role?: string
          visible_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          description: string
          escalated_at: string | null
          id: string
          opened_by: string | null
          opened_by_role: string
          payout_held: boolean
          photos: string[]
          reason_category: string
          refund_requested_pence: number | null
          resolution: string | null
          resolution_credit_pence: number | null
          resolution_note: string | null
          resolution_refund_pence: number | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_by_role: string | null
          responded_at: string | null
          response: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          description: string
          escalated_at?: string | null
          id?: string
          opened_by?: string | null
          opened_by_role: string
          payout_held?: boolean
          photos?: string[]
          reason_category: string
          refund_requested_pence?: number | null
          resolution?: string | null
          resolution_credit_pence?: number | null
          resolution_note?: string | null
          resolution_refund_pence?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_role?: string | null
          responded_at?: string | null
          response?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          description?: string
          escalated_at?: string | null
          id?: string
          opened_by?: string | null
          opened_by_role?: string
          payout_held?: boolean
          photos?: string[]
          reason_category?: string
          refund_requested_pence?: number | null
          resolution?: string | null
          resolution_credit_pence?: number | null
          resolution_note?: string | null
          resolution_refund_pence?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_by_role?: string | null
          responded_at?: string | null
          response?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dvla_vehicle_cache: {
        Row: {
          created_at: string
          mot_fetched_at: string | null
          mot_model: string | null
          reg: string
          updated_at: string
          ves_details: Json | null
          ves_fetched_at: string | null
        }
        Insert: {
          created_at?: string
          mot_fetched_at?: string | null
          mot_model?: string | null
          reg: string
          updated_at?: string
          ves_details?: Json | null
          ves_fetched_at?: string | null
        }
        Update: {
          created_at?: string
          mot_fetched_at?: string | null
          mot_model?: string | null
          reg?: string
          updated_at?: string
          ves_details?: Json | null
          ves_fetched_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          blocks: Json
          key: string
          subject: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          blocks?: Json
          key: string
          subject?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          blocks?: Json
          key?: string
          subject?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          event_name: string
          id: string
          occurred_at: string
          properties: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          event_name: string
          id?: string
          occurred_at?: string
          properties?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          event_name?: string
          id?: string
          occurred_at?: string
          properties?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      haynespro_vehicle_cache: {
        Row: {
          car_type_id: number
          created_at: string
          description: string | null
          expires_at: string
          hp_make: string | null
          hp_model_label: string | null
          reg: string
          repairtime_type_id: number | null
          resolved_at: string | null
          resolved_by: string | null
          resolved_via: string
        }
        Insert: {
          car_type_id: number
          created_at?: string
          description?: string | null
          expires_at?: string
          hp_make?: string | null
          hp_model_label?: string | null
          reg: string
          repairtime_type_id?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_via?: string
        }
        Update: {
          car_type_id?: number
          created_at?: string
          description?: string | null
          expires_at?: string
          hp_make?: string | null
          hp_model_label?: string | null
          reg?: string
          repairtime_type_id?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          resolved_via?: string
        }
        Relationships: [
          {
            foreignKeyName: "haynespro_vehicle_cache_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "haynespro_vehicle_cache_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          mechanic_id: string
          offered_at: string
          responded_at: string | null
          response: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          mechanic_id: string
          offered_at?: string
          responded_at?: string | null
          response?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          mechanic_id?: string
          offered_at?: string
          responded_at?: string | null
          response?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offers_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      job_quote_lines: {
        Row: {
          created_at: string
          description: string
          fault_id: string | null
          hours: number | null
          id: string
          kind: string
          line_pence: number
          node_id: string | null
          part_id: string | null
          position: number
          quantity: number
          quote_id: string
          unit_pence: number
        }
        Insert: {
          created_at?: string
          description: string
          fault_id?: string | null
          hours?: number | null
          id?: string
          kind: string
          line_pence: number
          node_id?: string | null
          part_id?: string | null
          position?: number
          quantity?: number
          quote_id: string
          unit_pence: number
        }
        Update: {
          created_at?: string
          description?: string
          fault_id?: string | null
          hours?: number | null
          id?: string
          kind?: string
          line_pence?: number
          node_id?: string | null
          part_id?: string | null
          position?: number
          quantity?: number
          quote_id?: string
          unit_pence?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_quote_lines_fault_id_fkey"
            columns: ["fault_id"]
            isOneToOne: false
            referencedRelation: "booking_faults"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_quote_lines_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_quote_lines_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "job_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      job_quotes: {
        Row: {
          booking_id: string
          captured_at: string | null
          commission_rate: number
          created_at: string
          expires_at: string | null
          follow_on_booking_id: string | null
          hourly_rate_pence: number
          id: string
          kind: string
          labour_pence: number
          mechanic_id: string
          mechanic_payout_pence: number
          note: string | null
          parts_pence: number
          platform_fee_pence: number
          responded_at: string | null
          sent_at: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          title: string | null
          total_pence: number
          updated_at: string
        }
        Insert: {
          booking_id: string
          captured_at?: string | null
          commission_rate: number
          created_at?: string
          expires_at?: string | null
          follow_on_booking_id?: string | null
          hourly_rate_pence: number
          id?: string
          kind: string
          labour_pence?: number
          mechanic_id: string
          mechanic_payout_pence: number
          note?: string | null
          parts_pence?: number
          platform_fee_pence: number
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          title?: string | null
          total_pence: number
          updated_at?: string
        }
        Update: {
          booking_id?: string
          captured_at?: string | null
          commission_rate?: number
          created_at?: string
          expires_at?: string | null
          follow_on_booking_id?: string | null
          hourly_rate_pence?: number
          id?: string
          kind?: string
          labour_pence?: number
          mechanic_id?: string
          mechanic_payout_pence?: number
          note?: string | null
          parts_pence?: number
          platform_fee_pence?: number
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          title?: string | null
          total_pence?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_quotes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_quotes_follow_on_booking_id_fkey"
            columns: ["follow_on_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_quotes_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_quotes_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_revisions: {
        Row: {
          after: Json
          after_repair_ids: string[]
          after_total_pence: number
          before: Json
          before_total_pence: number
          booking_id: string
          created_at: string
          difference_pence: number
          expires_at: string | null
          hold_quote_id: string | null
          id: string
          mechanic_id: string
          note: string | null
          reason: string
          responded_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          after: Json
          after_repair_ids: string[]
          after_total_pence: number
          before: Json
          before_total_pence: number
          booking_id: string
          created_at?: string
          difference_pence: number
          expires_at?: string | null
          hold_quote_id?: string | null
          id?: string
          mechanic_id: string
          note?: string | null
          reason: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          after?: Json
          after_repair_ids?: string[]
          after_total_pence?: number
          before?: Json
          before_total_pence?: number
          booking_id?: string
          created_at?: string
          difference_pence?: number
          expires_at?: string | null
          hold_quote_id?: string | null
          id?: string
          mechanic_id?: string
          note?: string | null
          reason?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_revisions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_revisions_hold_quote_id_fkey"
            columns: ["hold_quote_id"]
            isOneToOne: false
            referencedRelation: "job_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_revisions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_revisions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_applications: {
        Row: {
          approved_mechanic_id: string | null
          bank_account_number_encrypted: string | null
          bank_sort_code_encrypted: string | null
          business_name: string | null
          business_number: string | null
          business_type: string | null
          created_at: string
          doc_photo_id: string | null
          doc_public_liability_insurance: string | null
          doc_qualification: string | null
          doc_trade_insurance: string | null
          doc_vat: string | null
          email: string
          full_name: string
          grace_enforced_at: string | null
          grace_period_ends_at: string | null
          id: string
          needs_info_note: string | null
          phone: string
          postcode: string
          reference_1_email: string | null
          reference_1_name: string | null
          reference_1_phone: string | null
          reference_1_relationship: string | null
          reference_2_email: string | null
          reference_2_name: string | null
          reference_2_phone: string | null
          reference_2_relationship: string | null
          rejection_reason: string | null
          resubmit_token: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          service_radius_miles: number
          source_area_id: string | null
          specialisms: string[]
          status: string
          submitted_at: string
          updated_at: string
          vat_registered: boolean
          verification: Json
          years_experience: number | null
        }
        Insert: {
          approved_mechanic_id?: string | null
          bank_account_number_encrypted?: string | null
          bank_sort_code_encrypted?: string | null
          business_name?: string | null
          business_number?: string | null
          business_type?: string | null
          created_at?: string
          doc_photo_id?: string | null
          doc_public_liability_insurance?: string | null
          doc_qualification?: string | null
          doc_trade_insurance?: string | null
          doc_vat?: string | null
          email: string
          full_name: string
          grace_enforced_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          needs_info_note?: string | null
          phone: string
          postcode: string
          reference_1_email?: string | null
          reference_1_name?: string | null
          reference_1_phone?: string | null
          reference_1_relationship?: string | null
          reference_2_email?: string | null
          reference_2_name?: string | null
          reference_2_phone?: string | null
          reference_2_relationship?: string | null
          rejection_reason?: string | null
          resubmit_token?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_radius_miles?: number
          source_area_id?: string | null
          specialisms?: string[]
          status?: string
          submitted_at?: string
          updated_at?: string
          vat_registered?: boolean
          verification?: Json
          years_experience?: number | null
        }
        Update: {
          approved_mechanic_id?: string | null
          bank_account_number_encrypted?: string | null
          bank_sort_code_encrypted?: string | null
          business_name?: string | null
          business_number?: string | null
          business_type?: string | null
          created_at?: string
          doc_photo_id?: string | null
          doc_public_liability_insurance?: string | null
          doc_qualification?: string | null
          doc_trade_insurance?: string | null
          doc_vat?: string | null
          email?: string
          full_name?: string
          grace_enforced_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          needs_info_note?: string | null
          phone?: string
          postcode?: string
          reference_1_email?: string | null
          reference_1_name?: string | null
          reference_1_phone?: string | null
          reference_1_relationship?: string | null
          reference_2_email?: string | null
          reference_2_name?: string | null
          reference_2_phone?: string | null
          reference_2_relationship?: string | null
          rejection_reason?: string | null
          resubmit_token?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          service_radius_miles?: number
          source_area_id?: string | null
          specialisms?: string[]
          status?: string
          submitted_at?: string
          updated_at?: string
          vat_registered?: boolean
          verification?: Json
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_applications_approved_mechanic_id_fkey"
            columns: ["approved_mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_applications_approved_mechanic_id_fkey"
            columns: ["approved_mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_applications_source_area_id_fkey"
            columns: ["source_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_availability: {
        Row: {
          day_of_week: number
          end_time: string | null
          is_active: boolean
          mechanic_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          day_of_week: number
          end_time?: string | null
          is_active?: boolean
          mechanic_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          day_of_week?: number
          end_time?: string | null
          is_active?: boolean
          mechanic_id?: string
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_availability_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_availability_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_daily_pushes: {
        Row: {
          day: string
          kind: string
          mechanic_id: string
          sent_at: string
        }
        Insert: {
          day: string
          kind: string
          mechanic_id: string
          sent_at?: string
        }
        Update: {
          day?: string
          kind?: string
          mechanic_id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_daily_pushes_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_daily_pushes_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_documents: {
        Row: {
          created_at: string
          doc_type: string
          expires_at: string | null
          file_url: string
          id: string
          mechanic_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          expires_at?: string | null
          file_url: string
          id?: string
          mechanic_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          expires_at?: string | null
          file_url?: string
          id?: string
          mechanic_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_documents_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_documents_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_flags: {
        Row: {
          created_at: string
          flag_type: string
          id: string
          mechanic_id: string
          notes: string | null
          related_dispute_id: string | null
          resolved_at: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          flag_type: string
          id?: string
          mechanic_id: string
          notes?: string | null
          related_dispute_id?: string | null
          resolved_at?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          flag_type?: string
          id?: string
          mechanic_id?: string
          notes?: string | null
          related_dispute_id?: string | null
          resolved_at?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_flags_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_flags_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_flags_related_dispute_id_fkey"
            columns: ["related_dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_inbox_reads: {
        Row: {
          mechanic_id: string
          read_before: string | null
          read_ids: string[]
          updated_at: string
        }
        Insert: {
          mechanic_id: string
          read_before?: string | null
          read_ids?: string[]
          updated_at?: string
        }
        Update: {
          mechanic_id?: string
          read_before?: string | null
          read_ids?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_inbox_reads_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: true
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_inbox_reads_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: true
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_ledger: {
        Row: {
          amount_pence: number
          booking_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entry_type: string
          id: string
          mechanic_id: string
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_pence: number
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type: string
          id?: string
          mechanic_id: string
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_pence?: number
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_type?: string
          id?: string
          mechanic_id?: string
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_ledger_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_ledger_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_ledger_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_ledger_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_locations: {
        Row: {
          accuracy_m: number | null
          created_at: string
          heading_deg: number | null
          lat: number
          lng: number
          mechanic_id: string
          sharing_enabled: boolean
          speed_mps: number | null
          updated_at: string
        }
        Insert: {
          accuracy_m?: number | null
          created_at?: string
          heading_deg?: number | null
          lat: number
          lng: number
          mechanic_id: string
          sharing_enabled?: boolean
          speed_mps?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_m?: number | null
          created_at?: string
          heading_deg?: number | null
          lat?: number
          lng?: number
          mechanic_id?: string
          sharing_enabled?: boolean
          speed_mps?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_locations_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: true
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_locations_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: true
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_push_tokens: {
        Row: {
          created_at: string
          last_seen_at: string
          mechanic_id: string
          platform: string
          token: string
        }
        Insert: {
          created_at?: string
          last_seen_at?: string
          mechanic_id: string
          platform: string
          token: string
        }
        Update: {
          created_at?: string
          last_seen_at?: string
          mechanic_id?: string
          platform?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_push_tokens_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_push_tokens_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_suspensions: {
        Row: {
          id: string
          lifted_at: string | null
          lifted_by: string | null
          mechanic_id: string
          reason: string
          suspended_at: string
          suspended_by: string | null
          suspended_until: string | null
        }
        Insert: {
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          mechanic_id: string
          reason: string
          suspended_at?: string
          suspended_by?: string | null
          suspended_until?: string | null
        }
        Update: {
          id?: string
          lifted_at?: string | null
          lifted_by?: string | null
          mechanic_id?: string
          reason?: string
          suspended_at?: string
          suspended_by?: string | null
          suspended_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_suspensions_lifted_by_fkey"
            columns: ["lifted_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_suspensions_lifted_by_fkey"
            columns: ["lifted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_suspensions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_suspensions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_suspensions_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_suspensions_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          approved_at: string | null
          base_postcode: string | null
          bio: string | null
          created_at: string
          daily_goal_pence: number | null
          id: string
          is_pro: boolean
          is_suspended: boolean
          job_count: number
          last_seen_at: string | null
          online_at: string | null
          rating: number
          resume_online_at: string | null
          service_radius_miles: number
          specialisms: string[]
          status: string
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          stripe_onboarding_complete: boolean
          stripe_payouts_enabled: boolean
          suspended_until: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          base_postcode?: string | null
          bio?: string | null
          created_at?: string
          daily_goal_pence?: number | null
          id: string
          is_pro?: boolean
          is_suspended?: boolean
          job_count?: number
          last_seen_at?: string | null
          online_at?: string | null
          rating?: number
          resume_online_at?: string | null
          service_radius_miles?: number
          specialisms?: string[]
          status?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean
          suspended_until?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          base_postcode?: string | null
          bio?: string | null
          created_at?: string
          daily_goal_pence?: number | null
          id?: string
          is_pro?: boolean
          is_suspended?: boolean
          job_count?: number
          last_seen_at?: string | null
          online_at?: string | null
          rating?: number
          resume_online_at?: string | null
          service_radius_miles?: number
          specialisms?: string[]
          status?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean
          suspended_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          sender_role: string
          sms_notified_at: string | null
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          sender_role: string
          sms_notified_at?: string | null
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
          sms_notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_toggles: {
        Row: {
          channel: string
          enabled: boolean
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel: string
          enabled?: boolean
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel?: string
          enabled?: boolean
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_toggles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_toggles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      part_group_settings: {
        Row: {
          changed_at: string
          changed_by: string | null
          charged: boolean
          description: string | null
          genart_id: number
          set_price_pence: number | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          charged?: boolean
          description?: string | null
          genart_id: number
          set_price_pence?: number | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          charged?: boolean
          description?: string | null
          genart_id?: number
          set_price_pence?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "part_group_settings_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_group_settings_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          bmt_price_pence: number
          category: string
          created_at: string
          description: string | null
          id: string
          in_stock: boolean
          is_active: boolean
          name: string
          sku: string | null
          supplier: string | null
          supplier_cost_pence: number
          updated_at: string
          vehicle_compatibility: Json | null
        }
        Insert: {
          bmt_price_pence: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          in_stock?: boolean
          is_active?: boolean
          name: string
          sku?: string | null
          supplier?: string | null
          supplier_cost_pence: number
          updated_at?: string
          vehicle_compatibility?: Json | null
        }
        Update: {
          bmt_price_pence?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          in_stock?: boolean
          is_active?: boolean
          name?: string
          sku?: string | null
          supplier?: string | null
          supplier_cost_pence?: number
          updated_at?: string
          vehicle_compatibility?: Json | null
        }
        Relationships: []
      }
      pending_email_changes: {
        Row: {
          confirmed_at: string | null
          created_at: string
          customer_id: string
          expires_at: string
          id: string
          new_email: string
          requested_ip: string | null
          token_hash: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          expires_at: string
          id?: string
          new_email: string
          requested_ip?: string | null
          token_hash: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          expires_at?: string
          id?: string
          new_email?: string
          requested_ip?: string | null
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_email_changes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_email_changes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_audit_log: {
        Row: {
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          field: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          field: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          field?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          reminder_via_email: boolean
          reminder_via_push: boolean
          reminder_via_sms: boolean
          reminders_enabled: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          reminder_via_email?: boolean
          reminder_via_push?: boolean
          reminder_via_sms?: boolean
          reminders_enabled?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          reminder_via_email?: boolean
          reminder_via_push?: boolean
          reminder_via_sms?: boolean
          reminders_enabled?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_code_sends: {
        Row: {
          channel: string
          code_id: string
          customer_id: string
          error: string | null
          id: string
          sent_at: string
          sent_by: string | null
        }
        Insert: {
          channel: string
          code_id: string
          customer_id: string
          error?: string | null
          id?: string
          sent_at?: string
          sent_by?: string | null
        }
        Update: {
          channel?: string
          code_id?: string
          customer_id?: string
          error?: string | null
          id?: string
          sent_at?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_sends_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_sends_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_sends_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_sends_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_sends_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          kind: string
          max_redemptions: number | null
          min_total_pence: number
          per_customer_limit: number
          starts_at: string
          updated_at: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind: string
          max_redemptions?: number | null
          min_total_pence?: number
          per_customer_limit?: number
          starts_at?: string
          updated_at?: string
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          max_redemptions?: number | null
          min_total_pence?: number
          per_customer_limit?: number
          starts_at?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_redemptions: {
        Row: {
          booking_id: string | null
          code_id: string
          created_at: string
          customer_id: string
          discount_pence: number
          expires_at: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          booking_id?: string | null
          code_id: string
          created_at?: string
          customer_id: string
          discount_pence: number
          expires_at?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          booking_id?: string | null
          code_id?: string
          created_at?: string
          customer_id?: string
          discount_pence?: number
          expires_at?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_redemptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_receipts: {
        Row: {
          created_at: string
          ticket_id: string
          token: string
        }
        Insert: {
          created_at?: string
          ticket_id: string
          token: string
        }
        Update: {
          created_at?: string
          ticket_id?: string
          token?: string
        }
        Relationships: []
      }
      reminder_schedules: {
        Row: {
          acted_on_at: string | null
          created_at: string
          customer_email: string | null
          customer_id: string | null
          id: string
          reminder_type: string
          scheduled_for: string
          sent_at: string | null
          service_suggestion_slug: string | null
          source_booking_id: string | null
          token: string
          vehicle_reg: string
        }
        Insert: {
          acted_on_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          reminder_type: string
          scheduled_for: string
          sent_at?: string | null
          service_suggestion_slug?: string | null
          source_booking_id?: string | null
          token?: string
          vehicle_reg: string
        }
        Update: {
          acted_on_at?: string | null
          created_at?: string
          customer_email?: string | null
          customer_id?: string | null
          id?: string
          reminder_type?: string
          scheduled_for?: string
          sent_at?: string | null
          service_suggestion_slug?: string | null
          source_booking_id?: string | null
          token?: string
          vehicle_reg?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_schedules_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_schedules_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_schedules_source_booking_id_fkey"
            columns: ["source_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_bundle_options: {
        Row: {
          bundle_id: string
          created_at: string
          id: string
          label: string
          node_ids: string[]
          position: number
        }
        Insert: {
          bundle_id: string
          created_at?: string
          id?: string
          label: string
          node_ids?: string[]
          position?: number
        }
        Update: {
          bundle_id?: string
          created_at?: string
          id?: string
          label?: string
          node_ids?: string[]
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "repair_bundle_options_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "repair_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_bundles: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          node_ids: string[]
          parent_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          node_ids?: string[]
          parent_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          node_ids?: string[]
          parent_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      repair_catalogue_groups: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          parent_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          parent_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          parent_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      repair_catalogue_overrides: {
        Row: {
          custom_name: string | null
          description: string | null
          display_order: number | null
          kind: string
          node_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          custom_name?: string | null
          description?: string | null
          display_order?: number | null
          kind: string
          node_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          custom_name?: string | null
          description?: string | null
          display_order?: number | null
          kind?: string
          node_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      repair_part_choices: {
        Row: {
          brand: string | null
          car_type_id: number
          chosen_at: string
          chosen_by: string | null
          description: string | null
          genart_id: number
          node_id: string
          part_number: string
          supplier: string
        }
        Insert: {
          brand?: string | null
          car_type_id: number
          chosen_at?: string
          chosen_by?: string | null
          description?: string | null
          genart_id: number
          node_id: string
          part_number: string
          supplier: string
        }
        Update: {
          brand?: string | null
          car_type_id?: number
          chosen_at?: string
          chosen_by?: string | null
          description?: string | null
          genart_id?: number
          node_id?: string
          part_number?: string
          supplier?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_part_choices_chosen_by_fkey"
            columns: ["chosen_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_part_choices_chosen_by_fkey"
            columns: ["chosen_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_vehicle_exclusions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          make_name: string
          mode: string
          model_name: string
          node_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          make_name: string
          mode?: string
          model_name: string
          node_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          make_name?: string
          mode?: string
          model_name?: string
          node_id?: string
        }
        Relationships: []
      }
      resolution_cases: {
        Row: {
          booking_id: string
          created_at: string
          description: string
          id: string
          mechanic_id: string
          opened_by: string | null
          opened_by_role: string
          photos: string[]
          reason_id: string | null
          reason_label: string
          redistributed: boolean
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          description: string
          id?: string
          mechanic_id: string
          opened_by?: string | null
          opened_by_role: string
          photos?: string[]
          reason_id?: string | null
          reason_label: string
          redistributed?: boolean
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          description?: string
          id?: string
          mechanic_id?: string
          opened_by?: string | null
          opened_by_role?: string
          photos?: string[]
          reason_id?: string | null
          reason_label?: string
          redistributed?: boolean
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_cases_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_cases_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_cases_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_cases_opened_by_fkey"
            columns: ["opened_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_cases_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "resolution_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_cases_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_cases_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_messages: {
        Row: {
          body: string
          case_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_role: string
        }
        Insert: {
          body: string
          case_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role: string
        }
        Update: {
          body?: string
          case_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "resolution_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "resolution_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resolution_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      resolution_reasons: {
        Row: {
          active: boolean
          created_at: string
          id: string
          label: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string | null
          id: string
          is_public: boolean
          mechanic_id: string
          mechanic_response: string | null
          rating: number
          tags: string[]
          visibility_changed_at: string | null
          visibility_changed_by: string | null
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_public?: boolean
          mechanic_id: string
          mechanic_response?: string | null
          rating: number
          tags?: string[]
          visibility_changed_at?: string | null
          visibility_changed_by?: string | null
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          is_public?: boolean
          mechanic_id?: string
          mechanic_response?: string | null
          rating?: number
          tags?: string[]
          visibility_changed_at?: string | null
          visibility_changed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_visibility_changed_by_fkey"
            columns: ["visibility_changed_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_visibility_changed_by_fkey"
            columns: ["visibility_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_credit_purchases: {
        Row: {
          amount_paid_pence: number
          created_at: string
          credits_purchased: number
          gocardless_payment_id: string | null
          id: string
          status: string
        }
        Insert: {
          amount_paid_pence: number
          created_at?: string
          credits_purchased: number
          gocardless_payment_id?: string | null
          id?: string
          status?: string
        }
        Update: {
          amount_paid_pence?: number
          created_at?: string
          credits_purchased?: number
          gocardless_payment_id?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      sms_log: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          message_body: string | null
          recipient_phone: string
          status: string
          twilio_sid: string | null
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          message_body?: string | null
          recipient_phone: string
          status: string
          twilio_sid?: string | null
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          message_body?: string | null
          recipient_phone?: string
          status?: string
          twilio_sid?: string | null
        }
        Relationships: []
      }
      sms_settings: {
        Row: {
          id: number
          low_credit_alert_email: string | null
          sms_credits_balance: number
          sms_enabled: boolean
          sms_low_credit_notified: boolean
          sms_sender_name: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          low_credit_alert_email?: string | null
          sms_credits_balance?: number
          sms_enabled?: boolean
          sms_low_credit_notified?: boolean
          sms_sender_name?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          low_credit_alert_email?: string | null
          sms_credits_balance?: number
          sms_enabled?: boolean
          sms_low_credit_notified?: boolean
          sms_sender_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          body: string
          key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body: string
          key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          livemode: boolean
          profile_id: string
          stripe_customer_id: string
        }
        Insert: {
          created_at?: string
          livemode: boolean
          profile_id: string
          stripe_customer_id: string
        }
        Update: {
          created_at?: string
          livemode?: boolean
          profile_id?: string
          stripe_customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      booking_area_options: {
        Row: {
          area: string | null
        }
        Relationships: []
      }
      customer_admin_summary: {
        Row: {
          bookings_count: number | null
          completed_count: number | null
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          joined_at: string | null
          last_booking_at: string | null
          last_sign_in_at: string | null
          open_disputes: number | null
          phone: string | null
          referral_code: string | null
          total_spent_pence: number | null
        }
        Relationships: []
      }
      mechanic_cards: {
        Row: {
          approved_at: string | null
          avatar_url: string | null
          bio: string | null
          full_name: string | null
          id: string | null
          is_pro: boolean | null
          job_count: number | null
          phone: string | null
          rating: number | null
          specialisms: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "mechanics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "customer_admin_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanics_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_public_reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          mechanic_id: string | null
          mechanic_response: string | null
          rating: number | null
          reviewer_first_name: string | null
          tags: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanic_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      analytics_funnel: {
        Args: { p_end: string; p_start: string }
        Returns: {
          event_name: string
          sessions: number
          step_order: number
        }[]
      }
      analytics_gmv_series: {
        Args: { p_end: string; p_granularity?: string; p_start: string }
        Returns: {
          bookings: number
          bucket: string
          gmv_pence: number
          net_pence: number
        }[]
      }
      can_track_mechanic: { Args: { p_mechanic_id: string }; Returns: boolean }
      consume_rate_limit: {
        Args: {
          p_bucket: string
          p_limit: number
          p_subject: string
          p_window_seconds: number
        }
        Returns: {
          allowed: boolean
          reset_at: string
          used: number
        }[]
      }
      delete_customer_account: {
        Args: {
          p_email: string
          p_ip?: string
          p_sentinel_email: string
          p_source?: string
          p_user_id: string
        }
        Returns: Json
      }
      derive_postcode_district: { Args: { p: string }; Returns: string }
      has_booking_with_mechanic: {
        Args: { p_mechanic_id: string }
        Returns: boolean
      }
      has_live_booking_with_mechanic: {
        Args: { p_mechanic_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      mark_inbox_all_read: { Args: never; Returns: undefined }
      mark_inbox_item_read: { Args: { p_item_id: string }; Returns: undefined }
      mark_mechanic_inbox_all_read: { Args: never; Returns: undefined }
      mark_mechanic_inbox_item_read: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      normalise_uk_postcode: { Args: { p: string }; Returns: string }
      owns_booking: { Args: { p_booking_id: string }; Returns: boolean }
      purge_stale_dvla_cache: { Args: { p_max_age?: string }; Returns: number }
      purge_stale_mechanic_locations: {
        Args: { p_max_age?: string }
        Returns: number
      }
      redeem_promo_code: {
        Args: {
          p_booking_id: string
          p_code_id: string
          p_customer_id: string
          p_discount_pence: number
          p_payment_intent_id: string
        }
        Returns: string
      }
      refund_sms_credit: { Args: never; Returns: undefined }
      reserve_sms_credit: { Args: never; Returns: number }
    }
    Enums: {
      user_role: "customer" | "mechanic" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      user_role: ["customer", "mechanic", "admin"],
    },
  },
} as const
