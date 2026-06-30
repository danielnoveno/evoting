export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
  app: {
    Tables: {
      app_profiles: {
        Row: {
          id: string
          user_id: string
          wallet_address: string
          display_name: string | null
          email: string | null
          role: 'voter' | 'admin' | 'super_admin'
          role_hint: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_address: string
          display_name?: string | null
          email?: string | null
          role?: 'voter' | 'admin' | 'super_admin'
          role_hint?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_address?: string
          display_name?: string | null
          email?: string | null
          role?: 'voter' | 'admin' | 'super_admin'
          role_hint?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activation_tokens: {
        Row: {
          id: string
          token_hash: string
          email: string
          role: 'voter' | 'admin' | 'super_admin'
          wallet_address: string | null
          status: 'pending' | 'used' | 'expired' | 'revoked'
          expires_at: string
          used_at: string | null
          used_by_user_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token_hash: string
          email: string
          role?: 'voter' | 'admin' | 'super_admin'
          wallet_address?: string | null
          status?: 'pending' | 'used' | 'expired' | 'revoked'
          expires_at: string
          used_at?: string | null
          used_by_user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token_hash?: string
          email?: string
          role?: 'voter' | 'admin' | 'super_admin'
          wallet_address?: string | null
          status?: 'pending' | 'used' | 'expired' | 'revoked'
          expires_at?: string
          used_at?: string | null
          used_by_user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      admin_registry: {
        Row: {
          email: string
          assigned_role: 'admin' | 'super_admin'
          organization_name: string | null
          access_scope: 'all' | 'specific'
          faculty: string | null
          status: 'pending' | 'active' | 'inactive'
          description: string | null
          wallet_address: string | null
          activation_token_hash: string | null
          activation_sent_at: string | null
          activation_expires_at: string | null
          activation_accepted_at: string | null
          created_by: string | null
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          email: string
          assigned_role?: 'admin' | 'super_admin'
          organization_name?: string | null
          access_scope?: 'all' | 'specific'
          faculty?: string | null
          status?: 'pending' | 'active' | 'inactive'
          description?: string | null
          wallet_address?: string | null
          activation_token_hash?: string | null
          activation_sent_at?: string | null
          activation_expires_at?: string | null
          activation_accepted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          assigned_role?: 'admin' | 'super_admin'
          organization_name?: string | null
          access_scope?: 'all' | 'specific'
          faculty?: string | null
          status?: 'pending' | 'active' | 'inactive'
          description?: string | null
          wallet_address?: string | null
          activation_token_hash?: string | null
          activation_sent_at?: string | null
          activation_expires_at?: string | null
          activation_accepted_at?: string | null
          created_by?: string | null
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      master_voters: {
        Row: {
          id: string
          nim: string
          full_name: string
          email: string
          prodi: string
          fakultas: string
          angkatan: string | null
          wallet_address: string | null
          status: 'active' | 'inactive' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nim: string
          full_name: string
          email: string
          prodi: string
          fakultas?: string
          angkatan?: string | null
          wallet_address?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nim?: string
          full_name?: string
          email?: string
          prodi?: string
          fakultas?: string
          angkatan?: string | null
          wallet_address?: string | null
          status?: 'active' | 'inactive' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      proposal_drafts: {
        Row: {
          id: string
          created_by: string
          title: string
          description: string | null
          banner_image_path: string | null
          organization_name: string | null
          theme_color: string
          rules_text: string | null
          candidate_count: number
          faculty: string | null
          status: 'draft' | 'submitted' | 'revision_requested' | 'approved' | 'rejected' | 'deployed' | 'archived'
          metadata_version: number
          onchain_proposal_id: number | null
          proposal_tx_hash: string | null
          review_tx_hash: string | null
          deployment_tx_hash: string | null
          deployed_space_id: number | null
          deployed_space_address: string | null
          commit_start_at: string | null
          registration_start_at: string | null
          reveal_start_at: string | null
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          title: string
          description?: string | null
          banner_image_path?: string | null
          organization_name?: string | null
          theme_color?: string
          rules_text?: string | null
          candidate_count?: number
          faculty?: string | null
          status?: 'draft' | 'submitted' | 'revision_requested' | 'approved' | 'rejected' | 'deployed' | 'archived'
          metadata_version?: number
          onchain_proposal_id?: number | null
          proposal_tx_hash?: string | null
          review_tx_hash?: string | null
          deployment_tx_hash?: string | null
          deployed_space_id?: number | null
          deployed_space_address?: string | null
          commit_start_at?: string | null
          registration_start_at?: string | null
          reveal_start_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          title?: string
          description?: string | null
          banner_image_path?: string | null
          organization_name?: string | null
          theme_color?: string
          rules_text?: string | null
          candidate_count?: number
          faculty?: string | null
          status?: 'draft' | 'submitted' | 'revision_requested' | 'approved' | 'rejected' | 'deployed' | 'archived'
          metadata_version?: number
          onchain_proposal_id?: number | null
          proposal_tx_hash?: string | null
          review_tx_hash?: string | null
          deployment_tx_hash?: string | null
          deployed_space_id?: number | null
          deployed_space_address?: string | null
          commit_start_at?: string | null
          registration_start_at?: string | null
          reveal_start_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      proposal_documents: {
        Row: {
          id: string
          proposal_draft_id: string
          uploaded_by: string
          file_path: string
          file_name: string
          content_type: string
          file_size: number
          document_type: 'supporting' | 'recommendation_letter'
          created_at: string
        }
        Insert: {
          id?: string
          proposal_draft_id: string
          uploaded_by: string
          file_path: string
          file_name: string
          content_type?: string
          file_size?: number
          document_type?: 'supporting' | 'recommendation_letter'
          created_at?: string
        }
        Update: {
          id?: string
          proposal_draft_id?: string
          uploaded_by?: string
          file_path?: string
          file_name?: string
          content_type?: string
          file_size?: number
          document_type?: 'supporting' | 'recommendation_letter'
          created_at?: string
        }
      }
      proposal_whitelist_entries: {
        Row: {
          id: string
          proposal_draft_id: string
          import_job_id: string | null
          wallet_address: string
          voter_name: string | null
          source: 'manual' | 'csv' | 'sync'
          validation_status: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          sync_status: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          latest_sync_tx_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_draft_id: string
          import_job_id?: string | null
          wallet_address: string
          voter_name?: string | null
          source?: 'manual' | 'csv' | 'sync'
          validation_status?: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          sync_status?: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          latest_sync_tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_draft_id?: string
          import_job_id?: string | null
          wallet_address?: string
          voter_name?: string | null
          source?: 'manual' | 'csv' | 'sync'
          validation_status?: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          sync_status?: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          latest_sync_tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      proposal_candidates: {
        Row: {
          id: string
          proposal_draft_id: string
          candidate_local_id: string
          full_name: string
          student_id: string | null
          faculty: string | null
          bio: string | null
          vision: string | null
          mission: Json
          youtube_url: string | null
          avatar_path: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_draft_id: string
          candidate_local_id: string
          full_name: string
          student_id?: string | null
          faculty?: string | null
          bio?: string | null
          vision?: string | null
          mission?: Json
          youtube_url?: string | null
          avatar_path?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_draft_id?: string
          candidate_local_id?: string
          full_name?: string
          student_id?: string | null
          faculty?: string | null
          bio?: string | null
          vision?: string | null
          mission?: Json
          youtube_url?: string | null
          avatar_path?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      whitelist_import_jobs: {
        Row: {
          id: string
          proposal_draft_id: string
          created_by: string
          file_path: string
          file_name: string
          row_count: number
          invalid_count: number
          status: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_draft_id: string
          created_by: string
          file_path: string
          file_name: string
          row_count?: number
          invalid_count?: number
          status?: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_draft_id?: string
          created_by?: string
          file_path?: string
          file_name?: string
          row_count?: number
          invalid_count?: number
          status?: 'pending' | 'valid' | 'invalid' | 'synced' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      space_registry_map: {
        Row: {
          id: string
          proposal_draft_id: string | null
          chain_id: number
          onchain_proposal_id: number | null
          space_id: number | null
          registry_address: string
          space_address: string | null
          owner_wallet: string
          deployment_tx_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          proposal_draft_id?: string | null
          chain_id?: number
          onchain_proposal_id?: number | null
          space_id?: number | null
          registry_address: string
          space_address?: string | null
          owner_wallet: string
          deployment_tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          proposal_draft_id?: string | null
          chain_id?: number
          onchain_proposal_id?: number | null
          space_id?: number | null
          registry_address?: string
          space_address?: string | null
          owner_wallet?: string
          deployment_tx_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tx_audit_log: {
        Row: {
          id: string
          space_id: number | null
          proposal_draft_id: string | null
          wallet_address: string
          action_type: 'submit_proposal' | 'review_proposal' | 'deploy_space' | 'register_voter' | 'unregister_voter' | 'phase_transition' | 'commit_vote' | 'reveal_vote' | 'suspend_space' | 'unsuspend_space' | 'terminate_space'
          tx_hash: string
          block_number: number | null
          status: string
          source: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id?: number | null
          proposal_draft_id?: string | null
          wallet_address: string
          action_type: 'submit_proposal' | 'review_proposal' | 'deploy_space' | 'register_voter' | 'unregister_voter' | 'phase_transition' | 'commit_vote' | 'reveal_vote' | 'suspend_space' | 'unsuspend_space' | 'terminate_space'
          tx_hash: string
          block_number?: number | null
          status?: string
          source?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: number | null
          proposal_draft_id?: string | null
          wallet_address?: string
          action_type?: 'submit_proposal' | 'review_proposal' | 'deploy_space' | 'register_voter' | 'unregister_voter' | 'phase_transition' | 'commit_vote' | 'reveal_vote' | 'suspend_space' | 'unsuspend_space' | 'terminate_space'
          tx_hash?: string
          block_number?: number | null
          status?: string
          source?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      notification_jobs: {
        Row: {
          id: string
          space_id: number | null
          target_profile_id: string | null
          target_wallet: string | null
          channel: 'in_app' | 'email' | 'webhook'
          template_key: string
          status: 'queued' | 'sent' | 'failed' | 'cancelled'
          payload: Json
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          space_id?: number | null
          target_profile_id?: string | null
          target_wallet?: string | null
          channel: 'in_app' | 'email' | 'webhook'
          template_key: string
          status?: 'queued' | 'sent' | 'failed' | 'cancelled'
          payload?: Json
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          space_id?: number | null
          target_profile_id?: string | null
          target_wallet?: string | null
          channel?: 'in_app' | 'email' | 'webhook'
          template_key?: string
          status?: 'queued' | 'sent' | 'failed' | 'cancelled'
          payload?: Json
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      platform_settings: {
        Row: {
          id: string
          platform_name: string
          default_language: string
          network_name: string
          rpc_url: string | null
          registry_address: string | null
          gas_limit: number
          updated_at: string
        }
        Insert: {
          id?: string
          platform_name?: string
          default_language?: string
          network_name?: string
          rpc_url?: string | null
          registry_address?: string | null
          gas_limit?: number
          updated_at?: string
        }
        Update: {
          id?: string
          platform_name?: string
          default_language?: string
          network_name?: string
          rpc_url?: string | null
          registry_address?: string | null
          gas_limit?: number
          updated_at?: string
        }
      }
      ops_audit_log: {
        Row: {
          id: string
          actor_profile_id: string | null
          actor_wallet: string | null
          action_name: string
          entity_type: string
          entity_id: string
          request_id: string | null
          before_state: Json | null
          after_state: Json | null
          related_tx_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_profile_id?: string | null
          actor_wallet?: string | null
          action_name: string
          entity_type: string
          entity_id: string
          request_id?: string | null
          before_state?: Json | null
          after_state?: Json | null
          related_tx_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_profile_id?: string | null
          actor_wallet?: string | null
          action_name?: string
          entity_type?: string
          entity_id?: string
          request_id?: string | null
          before_state?: Json | null
          after_state?: Json | null
          related_tx_hash?: string | null
          created_at?: string
        }
      }
      proof_exports: {
        Row: {
          id: string
          space_id: number | null
          owner_profile_id: string | null
          wallet_address: string
          proof_type: 'commit_receipt' | 'reveal_receipt' | 'space_report' | 'audit_bundle'
          file_path: string
          tx_hash: string | null
          generated_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          space_id?: number | null
          owner_profile_id?: string | null
          wallet_address: string
          proof_type: 'commit_receipt' | 'reveal_receipt' | 'space_report' | 'audit_bundle'
          file_path: string
          tx_hash?: string | null
          generated_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          space_id?: number | null
          owner_profile_id?: string | null
          wallet_address?: string
          proof_type?: 'commit_receipt' | 'reveal_receipt' | 'space_report' | 'audit_bundle'
          file_path?: string
          tx_hash?: string | null
          generated_at?: string
          metadata?: Json
        }
      }
      space_metadata_versions: {
        Row: {
          id: string
          proposal_draft_id: string
          version: number
          metadata_uri: string
          content_hash: string
          is_final: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          proposal_draft_id: string
          version: number
          metadata_uri: string
          content_hash: string
          is_final?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          proposal_draft_id?: string
          version?: number
          metadata_uri?: string
          content_hash?: string
          is_final?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
      risk_alerts: {
        Row: {
          id: string
          title: string
          description: string
          actor_label: string
          actor_value: string
          tone: 'danger' | 'warning' | 'info'
          status: 'active' | 'resolved' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          actor_label: string
          actor_value: string
          tone?: 'danger' | 'warning' | 'info'
          status?: 'active' | 'resolved' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          actor_label?: string
          actor_value?: string
          tone?: 'danger' | 'warning' | 'info'
          status?: 'active' | 'resolved' | 'blocked'
          created_at?: string
          updated_at?: string
        }
      }
      blocked_entities: {
        Row: {
          id: string
          entity_type: string
          entity_value: string
          reason: string | null
          blocked_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_value: string
          reason?: string | null
          blocked_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_value?: string
          reason?: string | null
          blocked_by?: string | null
          created_at?: string
        }
      }
      admin_space_access: {
        Row: {
          id: string
          admin_email: string
          proposal_draft_id: string
          created_at: string
        }
        Insert: {
          id?: string
          admin_email: string
          proposal_draft_id: string
          created_at?: string
        }
        Update: {
          id?: string
          admin_email?: string
          proposal_draft_id?: string
          created_at?: string
        }
      }
      user_wallets: {
        Row: {
          id: string
          user_id: string
          wallet_address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          wallet_address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          wallet_address?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
  indexer: {
    Tables: {
      indexer_sync_status: {
        Row: {
          id: string
          chain_id: number
          source_key: string
          latest_indexed_block: number | null
          latest_indexed_block_time: string | null
          latest_safe_block: number | null
          head_lag_blocks: number | null
          head_lag_seconds: number | null
          health_status: 'ok' | 'lagging' | 'resyncing' | 'degraded'
          last_error_message: string | null
          last_error_at: string | null
          last_reorg_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          chain_id?: number
          source_key: string
          latest_indexed_block?: number | null
          latest_indexed_block_time?: string | null
          latest_safe_block?: number | null
          head_lag_blocks?: number | null
          head_lag_seconds?: number | null
          health_status?: 'ok' | 'lagging' | 'resyncing' | 'degraded'
          last_error_message?: string | null
          last_error_at?: string | null
          last_reorg_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          chain_id?: number
          source_key?: string
          latest_indexed_block?: number | null
          latest_indexed_block_time?: string | null
          latest_safe_block?: number | null
          head_lag_blocks?: number | null
          head_lag_seconds?: number | null
          health_status?: 'ok' | 'lagging' | 'resyncing' | 'degraded'
          last_error_message?: string | null
          last_error_at?: string | null
          last_reorg_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type StorageBucket = 'space-metadata' | 'proof-exports' | 'proposal-documents' | 'public-assets'
