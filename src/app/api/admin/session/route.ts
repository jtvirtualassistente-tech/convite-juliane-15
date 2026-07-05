import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const granted =
    Boolean(process.env.ADMIN_ACCESS_CODE) &&
    cookieStore.get("juliane_admin_access")?.value === process.env.ADMIN_ACCESS_CODE;

  return NextResponse.json({ granted });
}
