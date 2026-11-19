import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Enter a project title.").max(120),
  description: z.string().trim().max(2000).default(""),
  discipline: z.string().trim().min(1, "Choose an engineering discipline.").max(80),
  project_type: z.string().trim().min(1, "Choose a project type.").max(80),
  student_role: z.string().trim().max(120).default(""),
  contributions: z.string().trim().max(2000).default(""),
  outcomes: z.string().trim().max(2000).default(""),
  tech_stack: z.array(z.string().trim().min(1)).max(20).default([]),
  github_url: z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().url("Enter a valid repository URL.").nullable().optional(),
  ),
  is_public: z.boolean().default(true),
  seeking_collaborators: z.boolean().default(false),
  collaboration_roles: z.array(z.string().trim().min(1)).max(10).default([]),
  post_summary: z.string().trim().max(500).default(""),
});

export type ProjectInput = z.infer<typeof projectSchema>;
