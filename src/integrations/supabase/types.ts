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
      accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          bn_name: string | null
          created_at: string
          id: string
          name: string
          village_id: string | null
        }
        Insert: {
          bn_name?: string | null
          created_at?: string
          id?: string
          name: string
          village_id?: string | null
        }
        Update: {
          bn_name?: string | null
          created_at?: string
          id?: string
          name?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          id: string
          remarks: string | null
          staff_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          id?: string
          remarks?: string | null
          staff_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          id?: string
          remarks?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          bill_number: string
          billing_month: string
          created_at: string
          customer_id: string
          discount: number | null
          due_amount: number | null
          due_date: string | null
          id: string
          late_fee: number | null
          notes: string | null
          paid_amount: number | null
          status: Database["public"]["Enums"]["bill_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          bill_number: string
          billing_month: string
          created_at?: string
          customer_id: string
          discount?: number | null
          due_amount?: number | null
          due_date?: string | null
          id?: string
          late_fee?: number | null
          notes?: string | null
          paid_amount?: number | null
          status?: Database["public"]["Enums"]["bill_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          bill_number?: string
          billing_month?: string
          created_at?: string
          customer_id?: string
          discount?: number | null
          due_amount?: number | null
          due_date?: string | null
          id?: string
          late_fee?: number | null
          notes?: string | null
          paid_amount?: number | null
          status?: Database["public"]["Enums"]["bill_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          created_at: string
          google_map_url: string | null
          holding_number: string | null
          house_number: string | null
          id: string
          name: string
          road_id: string | null
        }
        Insert: {
          created_at?: string
          google_map_url?: string | null
          holding_number?: string | null
          house_number?: string | null
          id?: string
          name: string
          road_id?: string | null
        }
        Update: {
          created_at?: string
          google_map_url?: string | null
          holding_number?: string | null
          house_number?: string | null
          id?: string
          name?: string
          road_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buildings_road_id_fkey"
            columns: ["road_id"]
            isOneToOne: false
            referencedRelation: "roads"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          address_line: string | null
          alt_mobile: string | null
          area_id: string | null
          avatar_path: string | null
          building_id: string | null
          connection_date: string | null
          created_at: string
          customer_code: string
          district_id: number | null
          division_id: number | null
          email: string | null
          expiry_date: string | null
          full_name: string
          holding_no: string | null
          id: string
          ip_address: string | null
          mikrotik_id: string | null
          mobile: string
          mohalla: string | null
          monthly_bill: number
          nid_number: string | null
          nid_url: string | null
          notes: string | null
          olt_id: string | null
          olt_port: string | null
          onu_mac: string | null
          onu_serial: string | null
          package_id: string | null
          photo_url: string | null
          post_office_id: string | null
          pppoe_password: string | null
          pppoe_username: string | null
          road_id: string | null
          road_name: string | null
          router_info: string | null
          splitter_info: string | null
          status: Database["public"]["Enums"]["customer_status"]
          union_id: string | null
          upazila_id: number | null
          updated_at: string
          user_id: string | null
          village_id: string | null
          zone_id: string | null
        }
        Insert: {
          address?: string | null
          address_line?: string | null
          alt_mobile?: string | null
          area_id?: string | null
          avatar_path?: string | null
          building_id?: string | null
          connection_date?: string | null
          created_at?: string
          customer_code: string
          district_id?: number | null
          division_id?: number | null
          email?: string | null
          expiry_date?: string | null
          full_name: string
          holding_no?: string | null
          id?: string
          ip_address?: string | null
          mikrotik_id?: string | null
          mobile: string
          mohalla?: string | null
          monthly_bill?: number
          nid_number?: string | null
          nid_url?: string | null
          notes?: string | null
          olt_id?: string | null
          olt_port?: string | null
          onu_mac?: string | null
          onu_serial?: string | null
          package_id?: string | null
          photo_url?: string | null
          post_office_id?: string | null
          pppoe_password?: string | null
          pppoe_username?: string | null
          road_id?: string | null
          road_name?: string | null
          router_info?: string | null
          splitter_info?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          union_id?: string | null
          upazila_id?: number | null
          updated_at?: string
          user_id?: string | null
          village_id?: string | null
          zone_id?: string | null
        }
        Update: {
          address?: string | null
          address_line?: string | null
          alt_mobile?: string | null
          area_id?: string | null
          avatar_path?: string | null
          building_id?: string | null
          connection_date?: string | null
          created_at?: string
          customer_code?: string
          district_id?: number | null
          division_id?: number | null
          email?: string | null
          expiry_date?: string | null
          full_name?: string
          holding_no?: string | null
          id?: string
          ip_address?: string | null
          mikrotik_id?: string | null
          mobile?: string
          mohalla?: string | null
          monthly_bill?: number
          nid_number?: string | null
          nid_url?: string | null
          notes?: string | null
          olt_id?: string | null
          olt_port?: string | null
          onu_mac?: string | null
          onu_serial?: string | null
          package_id?: string | null
          photo_url?: string | null
          post_office_id?: string | null
          pppoe_password?: string | null
          pppoe_username?: string | null
          road_id?: string | null
          road_name?: string | null
          router_info?: string | null
          splitter_info?: string | null
          status?: Database["public"]["Enums"]["customer_status"]
          union_id?: string | null
          upazila_id?: number | null
          updated_at?: string
          user_id?: string | null
          village_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          bn_name: string | null
          created_at: string
          division_id: number
          id: number
          name: string
        }
        Insert: {
          bn_name?: string | null
          created_at?: string
          division_id: number
          id?: number
          name: string
        }
        Update: {
          bn_name?: string | null
          created_at?: string
          division_id?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      divisions: {
        Row: {
          bn_name: string | null
          created_at: string
          id: number
          name: string
        }
        Insert: {
          bn_name?: string | null
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          bn_name?: string | null
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          id: string
          party_name: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          party_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          party_name?: string | null
        }
        Relationships: []
      }
      incomes: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          id: string
          party_name: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          party_name?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          id?: string
          party_name?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string
          current_stock: number
          id: string
          name: string
          notes: string | null
          reorder_level: number
          sale_price: number
          sku: string | null
          unit: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: string
          name: string
          notes?: string | null
          reorder_level?: number
          sale_price?: number
          sku?: string | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string
          current_stock?: number
          id?: string
          name?: string
          notes?: string | null
          reorder_level?: number
          sale_price?: number
          sku?: string | null
          unit?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entry_date: string
          entry_no: string
          id: string
          reference: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date: string
          entry_no: string
          id?: string
          reference?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_date?: string
          entry_no?: string
          id?: string
          reference?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          entry_id: string
          id: string
          memo: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id: string
          id?: string
          memo?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          entry_id?: string
          id?: string
          memo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          created_at: string
          id: string
          message: string | null
          name: string
          package_id: string | null
          package_name: string | null
          phone: string
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name: string
          package_id?: string | null
          package_name?: string | null
          phone: string
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          package_id?: string | null
          package_name?: string | null
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          from_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          staff_id: string
          status: Database["public"]["Enums"]["leave_status"]
          to_date: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          from_date: string
          id?: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          staff_id: string
          status?: Database["public"]["Enums"]["leave_status"]
          to_date: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          from_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          staff_id?: string
          status?: Database["public"]["Enums"]["leave_status"]
          to_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaves_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mikrotiks: {
        Row: {
          api_port: number | null
          cpu_load: number | null
          created_at: string
          id: string
          ip_address: string
          is_online: boolean | null
          last_checked_at: string | null
          name: string
          notes: string | null
          password: string
          ram_usage: number | null
          updated_at: string
          username: string
        }
        Insert: {
          api_port?: number | null
          cpu_load?: number | null
          created_at?: string
          id?: string
          ip_address: string
          is_online?: boolean | null
          last_checked_at?: string | null
          name: string
          notes?: string | null
          password: string
          ram_usage?: number | null
          updated_at?: string
          username: string
        }
        Update: {
          api_port?: number | null
          cpu_load?: number | null
          created_at?: string
          id?: string
          ip_address?: string
          is_online?: boolean | null
          last_checked_at?: string | null
          name?: string
          notes?: string | null
          password?: string
          ram_usage?: number | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: string
          created_at: string
          customer_id: string | null
          event_type: string | null
          id: string
          message: string
          recipient: string
          status: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          customer_id?: string | null
          event_type?: string | null
          id?: string
          message: string
          recipient: string
          status?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          customer_id?: string | null
          event_type?: string | null
          id?: string
          message?: string
          recipient?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      olts: {
        Row: {
          brand: Database["public"]["Enums"]["olt_brand"]
          cpu_load: number | null
          created_at: string
          id: string
          ip_address: string
          is_online: boolean | null
          last_checked_at: string | null
          name: string
          notes: string | null
          password: string | null
          pon_ports: number | null
          ram_usage: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          brand?: Database["public"]["Enums"]["olt_brand"]
          cpu_load?: number | null
          created_at?: string
          id?: string
          ip_address: string
          is_online?: boolean | null
          last_checked_at?: string | null
          name: string
          notes?: string | null
          password?: string | null
          pon_ports?: number | null
          ram_usage?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          brand?: Database["public"]["Enums"]["olt_brand"]
          cpu_load?: number | null
          created_at?: string
          id?: string
          ip_address?: string
          is_online?: boolean | null
          last_checked_at?: string | null
          name?: string
          notes?: string | null
          password?: string | null
          pon_ports?: number | null
          ram_usage?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      onus: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          is_enabled: boolean | null
          is_online: boolean | null
          last_seen_at: string | null
          mac_address: string | null
          notes: string | null
          olt_id: string | null
          pon_port: string | null
          serial_number: string
          signal_strength: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_enabled?: boolean | null
          is_online?: boolean | null
          last_seen_at?: string | null
          mac_address?: string | null
          notes?: string | null
          olt_id?: string | null
          pon_port?: string | null
          serial_number: string
          signal_strength?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          is_enabled?: boolean | null
          is_online?: boolean | null
          last_seen_at?: string | null
          mac_address?: string | null
          notes?: string | null
          olt_id?: string | null
          pon_port?: string | null
          serial_number?: string
          signal_strength?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onus_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onus_olt_id_fkey"
            columns: ["olt_id"]
            isOneToOne: false
            referencedRelation: "olts"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          download_speed: number
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          monthly_price: number
          name: string
          setup_charge: number | null
          updated_at: string
          upload_speed: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          download_speed: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_price: number
          name: string
          setup_charge?: number | null
          updated_at?: string
          upload_speed: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          download_speed?: number
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          monthly_price?: number
          name?: string
          setup_charge?: number | null
          updated_at?: string
          upload_speed?: number
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          bill_id: string | null
          created_at: string
          customer_id: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          paid_at: string
          receipt_number: string
          received_by: string | null
          submission_ref: string | null
          transaction_id: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          bill_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          receipt_number: string
          received_by?: string | null
          submission_ref?: string | null
          transaction_id?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          bill_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          paid_at?: string
          receipt_number?: string
          received_by?: string | null
          submission_ref?: string | null
          transaction_id?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_items: {
        Row: {
          allowances: number
          basic: number
          created_at: string
          deductions: number
          id: string
          net_amount: number
          paid: boolean
          run_id: string
          staff_id: string
        }
        Insert: {
          allowances?: number
          basic?: number
          created_at?: string
          deductions?: number
          id?: string
          net_amount?: number
          paid?: boolean
          run_id: string
          staff_id: string
        }
        Update: {
          allowances?: number
          basic?: number
          created_at?: string
          deductions?: number
          id?: string
          net_amount?: number
          paid?: boolean
          run_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_items_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          created_at: string
          finalized_at: string | null
          generated_by: string | null
          id: string
          period_month: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          generated_by?: string | null
          id?: string
          period_month: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          generated_by?: string | null
          id?: string
          period_month?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      post_offices: {
        Row: {
          bn_name: string | null
          code: string | null
          created_at: string
          id: string
          name: string
          union_id: string
        }
        Insert: {
          bn_name?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
          union_id: string
        }
        Update: {
          bn_name?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          union_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_offices_union_id_fkey"
            columns: ["union_id"]
            isOneToOne: false
            referencedRelation: "unions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          mobile: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          mobile?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          mobile?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          discount: number
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          po_number: string
          status: string
          subtotal: number
          tax: number
          total: number
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount?: number
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      roads: {
        Row: {
          area_id: string | null
          bn_name: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          area_id?: string | null
          bn_name?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          area_id?: string | null
          bn_name?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "roads_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          about_text: string | null
          address: string | null
          auto_billing_enabled: boolean
          auto_suspend_after_days: number
          bill_due_days: number
          bill_generation_day: number
          email: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          hotline: string | null
          id: number
          isp_name: string | null
          landing_content: Json | null
          logo_url: string | null
          notification_toggles: Json | null
          overdue_notice_days: number[]
          site_description: string | null
          site_title: string | null
          sms_api_config: Json | null
          updated_at: string
          website: string | null
          whatsapp: string | null
          whatsapp_api_config: Json | null
        }
        Insert: {
          about_text?: string | null
          address?: string | null
          auto_billing_enabled?: boolean
          auto_suspend_after_days?: number
          bill_due_days?: number
          bill_generation_day?: number
          email?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hotline?: string | null
          id?: number
          isp_name?: string | null
          landing_content?: Json | null
          logo_url?: string | null
          notification_toggles?: Json | null
          overdue_notice_days?: number[]
          site_description?: string | null
          site_title?: string | null
          sms_api_config?: Json | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          whatsapp_api_config?: Json | null
        }
        Update: {
          about_text?: string | null
          address?: string | null
          auto_billing_enabled?: boolean
          auto_suspend_after_days?: number
          bill_due_days?: number
          bill_generation_day?: number
          email?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hotline?: string | null
          id?: number
          isp_name?: string | null
          landing_content?: Json | null
          logo_url?: string | null
          notification_toggles?: Json | null
          overdue_notice_days?: number[]
          site_description?: string | null
          site_title?: string | null
          sms_api_config?: Json | null
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          whatsapp_api_config?: Json | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          department: string | null
          designation: string | null
          email: string | null
          full_name: string
          id: string
          joining_date: string | null
          mobile: string | null
          nid: string | null
          notes: string | null
          salary: number
          staff_code: string
          status: Database["public"]["Enums"]["staff_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name: string
          id?: string
          joining_date?: string | null
          mobile?: string | null
          nid?: string | null
          notes?: string | null
          salary?: number
          staff_code: string
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          full_name?: string
          id?: string
          joining_date?: string | null
          mobile?: string | null
          nid?: string | null
          notes?: string | null
          salary?: number
          staff_code?: string
          status?: Database["public"]["Enums"]["staff_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          move_type: string | null
          moved_at: string
          moved_by: string | null
          movement_type: string | null
          notes: string | null
          quantity: number
          reference: string | null
          unit_cost: number
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          move_type?: string | null
          moved_at?: string
          moved_by?: string | null
          movement_type?: string | null
          notes?: string | null
          quantity?: number
          reference?: string | null
          unit_cost?: number
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          move_type?: string | null
          moved_at?: string
          moved_by?: string | null
          movement_type?: string | null
          notes?: string | null
          quantity?: number
          reference?: string | null
          unit_cost?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_fk"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          created_at: string
          id: string
          is_staff: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_staff?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["ticket_category"]
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["ticket_category"]
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      unions: {
        Row: {
          bn_name: string | null
          created_at: string
          id: string
          name: string
          upazila_id: number
        }
        Insert: {
          bn_name?: string | null
          created_at?: string
          id?: string
          name: string
          upazila_id: number
        }
        Update: {
          bn_name?: string | null
          created_at?: string
          id?: string
          name?: string
          upazila_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "unions_upazila_id_fkey"
            columns: ["upazila_id"]
            isOneToOne: false
            referencedRelation: "upazilas"
            referencedColumns: ["id"]
          },
        ]
      }
      upazilas: {
        Row: {
          bn_name: string | null
          created_at: string
          district_id: number
          id: number
          name: string
        }
        Insert: {
          bn_name?: string | null
          created_at?: string
          district_id: number
          id?: number
          name: string
        }
        Update: {
          bn_name?: string | null
          created_at?: string
          district_id?: number
          id?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "upazilas_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
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
      vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          mobile: string | null
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      villages: {
        Row: {
          bn_name: string | null
          created_at: string
          id: string
          name: string
          post_office_id: string
        }
        Insert: {
          bn_name?: string | null
          created_at?: string
          id?: string
          name: string
          post_office_id: string
        }
        Update: {
          bn_name?: string | null
          created_at?: string
          id?: string
          name?: string
          post_office_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villages_post_office_id_fkey"
            columns: ["post_office_id"]
            isOneToOne: false
            referencedRelation: "post_offices"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_verify_payment: {
        Args: { _approve: boolean; _payment_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      public_get_landing_settings: { Args: never; Returns: Json }
      public_get_receipt: { Args: { _receipt: string }; Returns: Json }
      public_lookup_bill: { Args: { _code: string }; Returns: Json }
      public_submit_payment: {
        Args: {
          _bill_id: string
          _method: string
          _msisdn: string
          _transaction_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "income" | "expense"
      app_role: "admin" | "staff" | "customer"
      attendance_status: "present" | "absent" | "leave" | "half_day" | "late"
      bill_status: "paid" | "unpaid" | "partial" | "overdue"
      customer_status: "active" | "pending" | "suspended" | "expired"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type: "casual" | "sick" | "annual" | "unpaid" | "other"
      olt_brand: "vsol" | "cdata" | "huawei" | "bdcom" | "zte" | "other"
      payment_method: "cash" | "bkash" | "nagad" | "rocket" | "bank" | "other"
      staff_status: "active" | "inactive"
      ticket_category:
        | "no_internet"
        | "slow_speed"
        | "payment_issue"
        | "router_issue"
        | "onu_issue"
        | "other"
      ticket_status: "pending" | "in_progress" | "solved" | "closed"
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
      account_type: ["asset", "liability", "equity", "income", "expense"],
      app_role: ["admin", "staff", "customer"],
      attendance_status: ["present", "absent", "leave", "half_day", "late"],
      bill_status: ["paid", "unpaid", "partial", "overdue"],
      customer_status: ["active", "pending", "suspended", "expired"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: ["casual", "sick", "annual", "unpaid", "other"],
      olt_brand: ["vsol", "cdata", "huawei", "bdcom", "zte", "other"],
      payment_method: ["cash", "bkash", "nagad", "rocket", "bank", "other"],
      staff_status: ["active", "inactive"],
      ticket_category: [
        "no_internet",
        "slow_speed",
        "payment_issue",
        "router_issue",
        "onu_issue",
        "other",
      ],
      ticket_status: ["pending", "in_progress", "solved", "closed"],
    },
  },
} as const
