import { z } from 'zod';

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});

export const registerSchema = z.object({
  displayName: z.string().min(1, 'Name is required').max(80),
  email: z.string().email('Enter a valid email'),
  username: z
    .string()
    .min(3, 'At least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Letters, numbers, . _ - only'),
  password: z.string().min(8, 'At least 8 characters'),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'Enter the 6-digit code'),
  password: z.string().min(8, 'At least 8 characters'),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  key: z
    .string()
    .min(2, 'At least 2 characters')
    .max(10)
    .regex(/^[A-Za-z][A-Za-z0-9]+$/, 'Start with a letter; letters/numbers only')
    .transform((v) => v.toUpperCase()),
  description: z.string().max(2000).optional(),
  type: z.enum(['SCRUM', 'KANBAN']),
  isPrivate: z.boolean().optional(),
});

export const issueSchema = z.object({
  title: z.string().min(1, 'Summary is required').max(255),
  type: z.enum(['STORY', 'TASK', 'BUG', 'EPIC', 'SUBTASK', 'IMPROVEMENT']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']),
  description: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
  epicId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
  storyPoints: z.coerce.number().int().min(0).nullable().optional(),
  estimatedHours: z.coerce.number().min(0).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
});

export const sprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').max(100),
  goal: z.string().max(500).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ProjectForm = z.infer<typeof projectSchema>;
export type IssueForm = z.infer<typeof issueSchema>;
export type SprintForm = z.infer<typeof sprintSchema>;
