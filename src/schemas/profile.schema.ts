import { z } from "zod";

const githubUsername = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .max(39, "GitHub usernames can be at most 39 characters.")
    .regex(
      /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/,
      "Enter a valid GitHub username.",
    )
    .nullable(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().url("Enter a valid GitHub URL.").nullable().optional(),
);

const optionalTextArray = z.preprocess(
  (value) => Array.isArray(value) ? value : [],
  z.array(z.string().trim().min(1)).max(12),
);

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your full name.")
    .max(80, "Keep your name under 80 characters."),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(
      /^[a-z0-9_]+$/,
      "Use lowercase letters, numbers, and underscores only.",
    ),
  major: z
    .string()
    .trim()
    .min(2, "Enter your major or program.")
    .max(100, "Keep your major under 100 characters."),
  campus: z
    .string()
    .trim()
    .min(2, "Enter your KSU campus.")
    .max(80, "Keep your campus name under 80 characters."),
  bio: z.string().trim().max(280, "Bio must be 280 characters or fewer."),
  academic_year: z.string().trim().max(40).optional().nullable(),
  interests: optionalTextArray,
  profile_picture_url: z.string().trim().url().nullable().optional(),
  github_username: githubUsername,
  github_url: optionalUrl,
  is_discoverable: z.boolean().optional().default(true),
  show_availability: z.boolean().optional().default(false),
  skills: z
    .array(
      z.object({
        skill_id: z.string().uuid(),
        proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]),
      }),
    )
    .min(0)
    .max(12, "Select no more than 12 skills.")
    .refine(
      (skills) => new Set(skills.map((skill) => skill.skill_id)).size === skills.length,
      "A skill can only be selected once.",
    )
    .default([]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export function isProfileComplete(
  profile: {
    full_name: string | null;
    username: string | null;
    major: string | null;
    campus: string | null;
  } | null,
  skillCount: number,
): boolean {
  return Boolean(
    profile?.full_name?.trim() &&
      profile.username?.trim() &&
      profile.major?.trim() &&
      profile.campus?.trim(),
  );
}
