import { verifyCurrentAdmin } from "./firebase";

export async function checkAdminAccess(): Promise<boolean> {
  try {
    const adminUser = await verifyCurrentAdmin();
    return !!adminUser;
  } catch {
    return false;
  }
}

// Make accessible to browser window if needed
if (typeof window !== "undefined") {
  (window as any).checkAdminAccess = checkAdminAccess;
}
