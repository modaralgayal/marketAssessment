import { z } from "zod";

export const accessRequestStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);
export type AccessRequestStatus = z.infer<typeof accessRequestStatusSchema>;

/** Submitted publicly by a visitor who wants a buyer/manufacturer account. */
export const createAccessRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(500),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email").max(2000),
  company: z.string().trim().max(500).optional(),
  intendedRole: z.enum(["BUYER", "MANUFACTURER"]),
  message: z.string().trim().max(5000).optional(),
});
export type CreateAccessRequestInput = z.infer<typeof createAccessRequestSchema>;

/** Admin may override the role at approval time (defaults to intendedRole). */
export const approveAccessRequestSchema = z.object({
  role: z.enum(["BUYER", "MANUFACTURER"]).optional(),
});
export type ApproveAccessRequestInput = z.infer<typeof approveAccessRequestSchema>;

export interface AccessRequestDto {
  id: string;
  name: string;
  email: string;
  company?: string | null;
  intendedRole: "BUYER" | "MANUFACTURER";
  message?: string | null;
  status: AccessRequestStatus;
  inviteToken?: string | null;
  reviewedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}
