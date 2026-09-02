export const ROLE_VALUES = ["admin", "ad"] as const;
export type Role = (typeof ROLE_VALUES)[number];

export function isRole(value: string): value is Role {
  return (ROLE_VALUES as readonly string[]).includes(value);
}

/**
 * Administrator: full read/write access to every page.
 * AD (Quản lý Đại lý): only /dashboard plus full CRUD on recruitment
 * submissions — no access to documents, settings, or user management.
 */
export function canAccessDocuments(role: Role) {
  return role === "admin";
}

export function canAccessSettings(role: Role) {
  return role === "admin";
}

export function canAccessUsers(role: Role) {
  return role === "admin";
}

export function canAccessRecruitments(role: Role) {
  return role === "admin" || role === "ad";
}
