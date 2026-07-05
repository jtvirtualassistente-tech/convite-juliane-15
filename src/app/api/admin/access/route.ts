import { NextResponse } from "next/server";

const cookieName = "juliane_admin_access";

export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };
  const expectedCode = process.env.ADMIN_ACCESS_CODE;

  if (!expectedCode) {
    return NextResponse.json(
      { ok: false, message: "ADMIN_ACCESS_CODE nao configurado." },
      { status: 500 },
    );
  }

  if (code !== expectedCode) {
    return NextResponse.json(
      { ok: false, message: "Codigo de acesso incorreto." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, expectedCode, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(cookieName);
  return response;
}
