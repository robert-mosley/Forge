type Table<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Proficiency = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillSource = "manual" | "project" | "course";

export type ProfileRow = {
  id: string;
  username: string | null;
  full_name: string | null;
  major: string | null;
  campus: string | null;
  bio: string | null;
  github_username: string | null;
  github_url: string | null;
  profile_picture_url: string | null;
  academic_year: string | null;
  interests: string[];
  is_discoverable: boolean;
  show_availability: boolean;
  embedding: number[] | null;
  created_at: string;
};

export type SkillRow = {
  id: string;
  canonical_name: string;
  category: string;
  created_at: string;
};

export type StudentSkillRow = {
  user_id: string;
  skill_id: string;
  proficiency: Proficiency;
  source: SkillSource;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        {
          id: string;
          username?: string | null;
          full_name?: string | null;
          major?: string | null;
          campus?: string | null;
          bio?: string | null;
          github_username?: string | null;
          github_url?: string | null;
          profile_picture_url?: string | null;
          academic_year?: string | null;
          interests?: string[];
          is_discoverable?: boolean;
          show_availability?: boolean;
          embedding?: number[] | null;
          created_at?: string;
        }
      >;
      projects: Table<
        {
          id: string;
          user_id: string;
          github_url: string | null;
          repo_name: string;
          title: string;
          discipline: string | null;
          project_type: string | null;
          student_role: string | null;
          contributions: string | null;
          outcomes: string | null;
          description: string | null;
          technical_overview: string | null;
          tech_stack: string[];
          processing_status: "pending" | "processing" | "ready" | "failed";
          is_public: boolean;
          seeking_collaborators: boolean;
          collaboration_roles: string[];
          post_summary: string | null;
          embedding: number[] | null;
          created_at: string;
        },
        {
          id?: string;
          user_id: string;
          github_url?: string | null;
          repo_name: string;
          title?: string;
          discipline?: string | null;
          project_type?: string | null;
          student_role?: string | null;
          contributions?: string | null;
          outcomes?: string | null;
          description?: string | null;
          technical_overview?: string | null;
          tech_stack?: string[];
          processing_status?: "pending" | "processing" | "ready" | "failed";
          is_public?: boolean;
          seeking_collaborators?: boolean;
          collaboration_roles?: string[];
          post_summary?: string | null;
          embedding?: number[] | null;
          created_at?: string;
        }
      >;
      project_evidence: Table<
        {
          id: string;
          project_id: string;
          title: string | null;
          file_name: string;
          file_type: string | null;
          file_url: string;
          storage_path: string | null;
          kind: string;
          created_at: string;
        },
        {
          id?: string;
          project_id: string;
          title?: string | null;
          file_name: string;
          file_type?: string | null;
          file_url: string;
          storage_path?: string | null;
          kind?: string;
          created_at?: string;
        }
      >;
      project_feed_actions: Table<
        {
          project_id: string;
          user_id: string;
          action: "like" | "save" | "interest";
          created_at: string;
        },
        {
          project_id: string;
          user_id: string;
          action: "like" | "save" | "interest";
          created_at?: string;
        }
      >;
      skills: Table<
        SkillRow,
        {
          id?: string;
          canonical_name: string;
          category: string;
          created_at?: string;
        }
      >;
      project_skills: Table<
        {
          id: string;
          project_id: string;
          skill_id: string;
          confidence: number;
          evidence_type: "readme" | "language" | "dependency" | "source";
          evidence_text: string;
          evidence_path: string | null;
          evidence_url: string | null;
        },
        {
          id?: string;
          project_id: string;
          skill_id: string;
          confidence: number;
          evidence_type: "readme" | "language" | "dependency" | "source";
          evidence_text: string;
          evidence_path?: string | null;
          evidence_url?: string | null;
        }
      >;
      student_skills: Table<StudentSkillRow, StudentSkillRow>;
      availability: Table<
        {
          id: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          campus: string | null;
        },
        {
          id?: string;
          user_id: string;
          day_of_week: number;
          start_time: string;
          end_time: string;
          campus?: string | null;
        }
      >;
      student_courses: Table<
        { user_id: string; course_code: string; semester: string },
        { user_id: string; course_code: string; semester: string }
      >;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
