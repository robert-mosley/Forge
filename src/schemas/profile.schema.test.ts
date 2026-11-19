import { describe, expect, it } from "vitest";
import { isProfileComplete, profileSchema } from "@/schemas/profile.schema";

const skillId = "550e8400-e29b-41d4-a716-446655440000";

describe("profile validation", () => {
  it("normalizes usernames and turns a blank GitHub name into null", () => {
    const result = profileSchema.safeParse({
      full_name: "Avery Student",
      username: "  Avery_01 ",
      major: "Computer Science",
      campus: "Marietta",
      bio: "",
      github_username: "",
      skills: [{ skill_id: skillId, proficiency: "intermediate" }],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("avery_01");
      expect(result.data.github_username).toBeNull();
    }
  });

  it("rejects duplicate selected skills", () => {
    const result = profileSchema.safeParse({
      full_name: "Avery Student",
      username: "avery_01",
      major: "Computer Science",
      campus: "Marietta",
      bio: "",
      github_username: "",
      skills: [
        { skill_id: skillId, proficiency: "beginner" },
        { skill_id: skillId, proficiency: "advanced" },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("requires core profile fields but not skills", () => {
    const completeProfile = {
      full_name: "Avery Student",
      username: "avery_01",
      major: "Computer Science",
      campus: "Marietta",
    };

    expect(isProfileComplete(completeProfile, 1)).toBe(true);
    expect(isProfileComplete(completeProfile, 0)).toBe(true);
    expect(isProfileComplete(null, 1)).toBe(false);
  });
});
