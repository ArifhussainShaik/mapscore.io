import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import Location from "@/models/Location";
import { getCurrentOrg } from "@/libs/tenant";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const locationId = url.searchParams.get("state");
  if (!code || !locationId) return NextResponse.json({ error: "Invalid callback" }, { status: 400 });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GBP_OAUTH_CLIENT_ID,
      client_secret: process.env.GBP_OAUTH_CLIENT_SECRET,
      redirect_uri: process.env.GBP_OAUTH_REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokens.access_token) return NextResponse.json({ error: "Token exchange failed" }, { status: 400 });

  await connectMongo();
  const org = await getCurrentOrg(session);
  const location = await Location.findOne({ _id: locationId, orgId: org._id });
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });

  location.gbpOAuth = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiry: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
  };
  location.managed = true;
  await location.save();

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(`${base}/dashboard/locations/${locationId}?gbp=connected`);
}
