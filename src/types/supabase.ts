export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          domain: string;
          industry: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          industry?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          industry?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'brands_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      competitors: {
        Row: {
          id: string;
          name: string;
          domain: string;
          brand_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          domain: string;
          brand_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          domain?: string;
          brand_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'competitors_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      topics: {
        Row: {
          id: string;
          name: string;
          auto_generated: boolean;
          brand_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          auto_generated?: boolean;
          brand_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          auto_generated?: boolean;
          brand_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'topics_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      prompts: {
        Row: {
          id: string;
          text: string;
          topic_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          topic_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          topic_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prompts_topic_id_fkey';
            columns: ['topic_id'];
            referencedRelation: 'topics';
            referencedColumns: ['id'];
          },
        ];
      };
      llm_responses: {
        Row: {
          id: string;
          prompt_id: string;
          provider: LLMProvider;
          response_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          provider: LLMProvider;
          response_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          prompt_id?: string;
          provider?: LLMProvider;
          response_text?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'llm_responses_prompt_id_fkey';
            columns: ['prompt_id'];
            referencedRelation: 'prompts';
            referencedColumns: ['id'];
          },
        ];
      };
      brand_mentions: {
        Row: {
          id: string;
          response_id: string;
          brand_id: string | null;
          competitor_id: string | null;
          brand_name: string;
          rank_position: number | null;
          is_cited: boolean;
          context: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          brand_id?: string | null;
          competitor_id?: string | null;
          brand_name: string;
          rank_position?: number | null;
          is_cited?: boolean;
          context?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          brand_id?: string | null;
          competitor_id?: string | null;
          brand_name?: string;
          rank_position?: number | null;
          is_cited?: boolean;
          context?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'brand_mentions_response_id_fkey';
            columns: ['response_id'];
            referencedRelation: 'llm_responses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'brand_mentions_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'brand_mentions_competitor_id_fkey';
            columns: ['competitor_id'];
            referencedRelation: 'competitors';
            referencedColumns: ['id'];
          },
        ];
      };
      cited_sources: {
        Row: {
          id: string;
          response_id: string;
          url: string;
          domain: string;
          title: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          response_id: string;
          url: string;
          domain: string;
          title?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          response_id?: string;
          url?: string;
          domain?: string;
          title?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cited_sources_response_id_fkey';
            columns: ['response_id'];
            referencedRelation: 'llm_responses';
            referencedColumns: ['id'];
          },
        ];
      };
      visibility_metrics: {
        Row: {
          id: string;
          brand_id: string;
          date: string;
          visibility_pct: number;
          avg_rank: number | null;
          citation_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          date: string;
          visibility_pct: number;
          avg_rank?: number | null;
          citation_count: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          date?: string;
          visibility_pct?: number;
          avg_rank?: number | null;
          citation_count?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'visibility_metrics_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_connections: {
        Row: {
          id: string;
          brand_id: string;
          provider: string;
          property_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          provider?: string;
          property_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: string;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          provider?: string;
          property_id?: string;
          access_token?: string;
          refresh_token?: string;
          expires_at?: string;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_connections_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      ai_traffic_data: {
        Row: {
          id: string;
          brand_id: string;
          date: string;
          source: string;
          sessions: number;
          users: number;
          engaged_sessions: number;
          conversions: number;
          revenue: number;
          bounce_rate: number | null;
          avg_session_duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          date: string;
          source: string;
          sessions?: number;
          users?: number;
          engaged_sessions?: number;
          conversions?: number;
          revenue?: number;
          bounce_rate?: number | null;
          avg_session_duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          date?: string;
          source?: string;
          sessions?: number;
          users?: number;
          engaged_sessions?: number;
          conversions?: number;
          revenue?: number;
          bounce_rate?: number | null;
          avg_session_duration?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_traffic_data_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      generated_content: {
        Row: {
          id: string;
          brand_id: string;
          topic_id: string | null;
          content_type: ContentType;
          content: string;
          reference_urls: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          topic_id?: string | null;
          content_type: ContentType;
          content: string;
          reference_urls?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          topic_id?: string | null;
          content_type?: ContentType;
          content?: string;
          reference_urls?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'generated_content_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'generated_content_topic_id_fkey';
            columns: ['topic_id'];
            referencedRelation: 'topics';
            referencedColumns: ['id'];
          },
        ];
      };
      recommendations: {
        Row: {
          id: string;
          brand_id: string;
          type: RecommendationType;
          priority: RecommendationPriority;
          title: string;
          description: string;
          impact: string;
          action_type: string;
          action_label: string;
          action_data: Json | null;
          status: RecommendationStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          type: RecommendationType;
          priority: RecommendationPriority;
          title: string;
          description: string;
          impact: string;
          action_type: string;
          action_label: string;
          action_data?: Json | null;
          status?: RecommendationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          type?: RecommendationType;
          priority?: RecommendationPriority;
          title?: string;
          description?: string;
          impact?: string;
          action_type?: string;
          action_label?: string;
          action_data?: Json | null;
          status?: RecommendationStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recommendations_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
      simulation_results: {
        Row: {
          id: string;
          brand_id: string;
          original_content: string;
          modified_content: string;
          prompt_ids: string[];
          results: Json;
          summary: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          original_content: string;
          modified_content: string;
          prompt_ids?: string[];
          results: Json;
          summary: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          original_content?: string;
          modified_content?: string;
          prompt_ids?: string[];
          results?: Json;
          summary?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'simulation_results_brand_id_fkey';
            columns: ['brand_id'];
            referencedRelation: 'brands';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    Functions: {
      aggregate_traffic: {
        Args: {
          p_brand_id: string;
          p_start_date: string;
        };
        Returns: {
          total_sessions: number;
          total_users: number;
          total_engaged_sessions: number;
          total_conversions: number;
          total_revenue: number;
        }[];
      };
      traffic_by_source: {
        Args: {
          p_brand_id: string;
          p_start_date: string;
        };
        Returns: {
          source: string;
          total_sessions: number;
          total_users: number;
          total_conversions: number;
          total_revenue: number;
        }[];
      };
      count_brand_prompts: {
        Args: {
          p_brand_id: string;
        };
        Returns: number;
      };
      count_brand_responses: {
        Args: {
          p_brand_id: string;
        };
        Returns: number;
      };
      count_brand_mentions: {
        Args: {
          p_brand_id: string;
        };
        Returns: number;
      };
      count_competitor_mentions: {
        Args: {
          p_competitor_id: string;
        };
        Returns: number;
      };
      get_visibility_trends: {
        Args: {
          p_brand_id: string;
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          date: string;
          visibility_pct: number;
          avg_rank: number | null;
          citation_count: number;
        }[];
      };
    };
    Enums: {
      llm_provider: LLMProvider;
      content_type: ContentType;
      recommendation_type: RecommendationType;
      recommendation_priority: RecommendationPriority;
      recommendation_status: RecommendationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Enum types
export type LLMProvider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'PERPLEXITY';
export type ContentType = 'BLOG' | 'LANDING' | 'COMPARISON' | 'FAQ' | 'GUIDE';
export type RecommendationType = 'CONTENT' | 'TECHNICAL' | 'OUTREACH' | 'COMPETITOR';
export type RecommendationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type RecommendationStatus = 'PENDING' | 'DONE' | 'DISMISSED';

// Helper types for table rows
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Brand = Database['public']['Tables']['brands']['Row'];
export type Competitor = Database['public']['Tables']['competitors']['Row'];
export type Topic = Database['public']['Tables']['topics']['Row'];
export type Prompt = Database['public']['Tables']['prompts']['Row'];
export type LLMResponse = Database['public']['Tables']['llm_responses']['Row'];
export type BrandMention = Database['public']['Tables']['brand_mentions']['Row'];
export type CitedSource = Database['public']['Tables']['cited_sources']['Row'];
export type VisibilityMetric = Database['public']['Tables']['visibility_metrics']['Row'];
export type AnalyticsConnection = Database['public']['Tables']['analytics_connections']['Row'];
export type AITrafficData = Database['public']['Tables']['ai_traffic_data']['Row'];
export type GeneratedContent = Database['public']['Tables']['generated_content']['Row'];
export type Recommendation = Database['public']['Tables']['recommendations']['Row'];
export type SimulationResult = Database['public']['Tables']['simulation_results']['Row'];

// Helper types for inserts
export type BrandInsert = Database['public']['Tables']['brands']['Insert'];
export type CompetitorInsert = Database['public']['Tables']['competitors']['Insert'];
export type TopicInsert = Database['public']['Tables']['topics']['Insert'];
export type PromptInsert = Database['public']['Tables']['prompts']['Insert'];
export type LLMResponseInsert = Database['public']['Tables']['llm_responses']['Insert'];
export type BrandMentionInsert = Database['public']['Tables']['brand_mentions']['Insert'];
export type CitedSourceInsert = Database['public']['Tables']['cited_sources']['Insert'];
export type VisibilityMetricInsert = Database['public']['Tables']['visibility_metrics']['Insert'];
export type AnalyticsConnectionInsert =
  Database['public']['Tables']['analytics_connections']['Insert'];
export type AITrafficDataInsert = Database['public']['Tables']['ai_traffic_data']['Insert'];
export type GeneratedContentInsert = Database['public']['Tables']['generated_content']['Insert'];
export type RecommendationInsert = Database['public']['Tables']['recommendations']['Insert'];
export type SimulationResultInsert = Database['public']['Tables']['simulation_results']['Insert'];

// Helper types for updates
export type BrandUpdate = Database['public']['Tables']['brands']['Update'];
export type CompetitorUpdate = Database['public']['Tables']['competitors']['Update'];
export type TopicUpdate = Database['public']['Tables']['topics']['Update'];
export type RecommendationUpdate = Database['public']['Tables']['recommendations']['Update'];
export type AnalyticsConnectionUpdate =
  Database['public']['Tables']['analytics_connections']['Update'];
