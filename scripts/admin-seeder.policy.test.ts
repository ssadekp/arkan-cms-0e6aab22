import { describe, expect, it } from "vitest";
import { getAdminSeederAction } from "./admin-seeder.policy";

describe("administrator seeder access safeguards", () => {
  it("creates an account only when no administrator exists", () => {
    expect(getAdminSeederAction({
      targetUserId: null,
      targetIsAdmin: false,
      targetIsSuperAdmin: false,
      anyAdminExists: false,
      existingSuperAdminId: null,
    })).toBe("create-user");
  });

  it("does not change an already seeded super administrator", () => {
    expect(getAdminSeederAction({
      targetUserId: "first-admin",
      targetIsAdmin: true,
      targetIsSuperAdmin: true,
      anyAdminExists: true,
      existingSuperAdminId: "first-admin",
    })).toBe("already-seeded");
  });

  it("refuses to create a second super administrator", () => {
    expect(() => getAdminSeederAction({
      targetUserId: "new-user",
      targetIsAdmin: false,
      targetIsSuperAdmin: false,
      anyAdminExists: true,
      existingSuperAdminId: "current-super-admin",
    })).toThrow("A different super administrator already exists.");
  });

  it("refuses to create another administrator when a different admin exists", () => {
    expect(() => getAdminSeederAction({
      targetUserId: null,
      targetIsAdmin: false,
      targetIsSuperAdmin: false,
      anyAdminExists: true,
      existingSuperAdminId: null,
    })).toThrow("Another administrator already exists. No account was changed.");
  });

  it("can promote the specifically selected existing admin without changing credentials", () => {
    expect(getAdminSeederAction({
      targetUserId: "existing-admin",
      targetIsAdmin: true,
      targetIsSuperAdmin: false,
      anyAdminExists: true,
      existingSuperAdminId: null,
    })).toBe("assign-roles");
  });
});