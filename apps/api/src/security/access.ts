export type AuthPrincipal = {
  userId: string;
  role: "user" | "admin";
};

export function canAccessRun(
  principal: AuthPrincipal,
  runOwnerId: string,
): boolean {
  return principal.role === "admin" || principal.userId === runOwnerId;
}

export function assertRunAccess(
  principal: AuthPrincipal,
  runOwnerId: string,
): void {
  if (!canAccessRun(principal, runOwnerId)) {
    throw new Error("RUN_ACCESS_DENIED");
  }
}
