import "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: number;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: number;
    role?: string;
  }
}
