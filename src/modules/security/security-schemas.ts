import { z } from "zod";
import { ROLE } from "@/lib/rbac";

const roleNames = Object.values(ROLE) as [string, ...string[]];

// LoginRequest (docs/openapi-smart-wcs.yaml /auth/login).
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// /users/me/password (docs/openapi-smart-wcs.yaml).
export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// UserCreateRequest.
export const userCreateSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(roleNames),
});

// UserUpdateRequest.
export const userUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.enum(roleNames).optional(),
  active: z.boolean().optional(),
});

export const userListQuerySchema = z.object({
  roleId: z.string().uuid().optional(),
});
