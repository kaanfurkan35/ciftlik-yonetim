import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      farmId: string;
      farmName: string;
      image?: string | null;
    };
  }

  interface User {
    role: UserRole;
    farmId: string;
    farmName: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    farmId: string;
    farmName: string;
  }
}
