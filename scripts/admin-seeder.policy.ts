export type AdminSeederState = {
  targetUserId: string | null;
  targetIsAdmin: boolean;
  targetIsSuperAdmin: boolean;
  anyAdminExists: boolean;
  existingSuperAdminId: string | null;
};

export type AdminSeederAction = "already-seeded" | "assign-roles" | "create-user";

export function getAdminSeederAction(state: AdminSeederState): AdminSeederAction {
  if (state.existingSuperAdminId) {
    if (state.existingSuperAdminId === state.targetUserId && state.targetIsSuperAdmin) {
      return "already-seeded";
    }
    throw new Error("A different super administrator already exists.");
  }

  if (state.targetIsAdmin || state.targetIsSuperAdmin) return "assign-roles";
  if (state.anyAdminExists) {
    throw new Error("Another administrator already exists. No account was changed.");
  }
  return state.targetUserId ? "assign-roles" : "create-user";
}