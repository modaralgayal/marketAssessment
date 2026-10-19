import { z } from "zod";

export const accountRoleSchema = z.enum(["BUYER", "MANUFACTURER", "ADMIN"]);
export type AccountRole = z.infer<typeof accountRoleSchema>;

export const accountStatusSchema = z.enum(["PENDING", "ACTIVE", "DISABLED"]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

/** Sent by the SPA after a successful Firebase sign-in to create the Account. */
export const bootstrapAccountSchema = z.object({
  inviteToken: z.string().min(1).optional(),
  /** When true, record acceptance of the current privacy-policy version. */
  acceptPrivacy: z.boolean().optional(),
});
export type BootstrapAccountInput = z.infer<typeof bootstrapAccountSchema>;

export interface AccountDto {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  inviteToken?: string | null;
  /** Privacy-policy version the user last accepted (null if never recorded). */
  privacyAcceptedVersion?: number | null;
  privacyAcceptedAt?: string | null;
  createdAt: string;
}

/** Admin listing of self-service buyer/manufacturer accounts. */
export interface AccountListDto {
  id: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  companyName?: string | null;
  createdAt: string;
}

/** The currently published privacy-policy version (public). `version: 0` means
 *  no version has been published yet. */
export const privacyVersionSchema = z.object({
  version: z.number().int(),
  effectiveDate: z.string().nullable(),
  note: z.string().nullable().optional(),
});
export type PrivacyPolicyVersionDto = z.infer<typeof privacyVersionSchema>;

/** Body for accepting the latest privacy policy (self-service). */
export const acceptPrivacySchema = z.object({ accept: z.literal(true) });
export type AcceptPrivacyInput = z.infer<typeof acceptPrivacySchema>;
