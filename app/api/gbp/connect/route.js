import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const SCOPE = "https://www.googleapis.com/auth/business.manage";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const locationId = new URL(req.url).searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  const params = new URLSearchParams({
    client_id: process.env.GBP_OAUTH_CLIENT_ID,
    redirect_uri: process.env.GBP_OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state: locationId,
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
