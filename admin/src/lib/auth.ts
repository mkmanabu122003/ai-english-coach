import { cookies } from "next/headers";
import { getAdminAuth } from "./firebase-admin";

interface SessionUser {
  uid: string;
  role: string;
  email?: string;
}

interface VerifiedSession {
  email: string;
  role: "admin" | "instructor";
}

async function getSessionUser(): Promise<SessionUser> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session) {
    throw new Error("No session cookie");
  }

  const auth = getAdminAuth();
  const decoded = await auth.verifySessionCookie(session, true);
  const role = (decoded.role as string) || "";

  return { uid: decoded.uid, role, email: decoded.email ?? "" };
}

export async function verifySession(): Promise<VerifiedSession | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session")?.value;
    if (!session) return null;

    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(session, true);
    const role = decoded.role as string;
    if (role !== "admin" && role !== "instructor") return null;

    return {
      email: decoded.email ?? "",
      role: role as "admin" | "instructor",
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user.role !== "admin") {
    throw new Error("Admin role required");
  }
  return user;
}

export async function requireAdminOrInstructor(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user.role !== "admin" && user.role !== "instructor") {
    throw new Error("Admin or instructor role required");
  }
  return user;
}
