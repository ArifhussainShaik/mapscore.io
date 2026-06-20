import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongo from "@/libs/mongoose";
import { getCurrentOrg } from "@/libs/tenant";
import { planByKey } from "@/libs/billing";
import { createSubscription } from "@/libs/dodo";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const plan = planByKey(body.planKey);
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  await connectMongo();
  const org = await getCurrentOrg(session);

  const { checkoutUrl } = await createSubscription({
    orgId: org._id.toString(),
    userId: session.user.id,
    productId: plan.productId,
    email: session.user.email,
  });

  return NextResponse.json({ url: checkoutUrl });
}
