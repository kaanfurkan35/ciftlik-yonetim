import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL geçerli bir URL olmalıdır"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET en az 32 karakter olmalıdır"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL geçerli bir URL olmalıdır").optional(),
});

export const env = envSchema.parse(process.env);
