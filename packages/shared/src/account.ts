import { z } from "zod";

export const accountRoleSchema = z.enum(["BUYER", "MANUFACTURER", "ADMIN"]);
export type AccountRole = z.infer<typeof accountRoleSchema>;

export const accountStatusSchema = z.enum(["PENDING", "ACTIVE", "DISABLED"]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

/** Sent by the SPA after a successful Firebase sign-in to create the Account. */
export const bootstrapAccountSchema = z.object({
  inviteToken: z.string().min(1).optional(),
});
export type BootstrapAccountInput = z.infer<typeof bootstrapAccountSchema>;

export interface AccountDto {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  inviteToken?: string | null;
  createdAt: string;
}
