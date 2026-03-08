import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Audit from "@/models/Audit";
import { getAvailableCredits, consumeCredit } from "@/libs/credits";
import connectMongo from "@/libs/mongoose";

// Use App Router dynamic route convention
export async function POST(req, { params }) {
    console.log('[UNLOCK] === Starting unlock process ===');

    try {
        // 1. Session check
        const session = await getServerSession(authOptions);
        console.log('[UNLOCK] Session:', session?.user?.email);
        if (!session) {
            return Response.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // 2. Get user
        await connectMongo();
        const User = (await import("@/models/User")).default;
        const user = await User.findOne({ email: session.user.email });
        console.log('[UNLOCK] User found:', user?._id);
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Get audit
        const { id } = await params;
        const auditId = id;
        console.log('[UNLOCK] Audit ID:', auditId);
        const audit = await Audit.findById(auditId);
        console.log('[UNLOCK] Audit found:', audit?._id);
        if (!audit) {
            return Response.json({ error: 'Audit not found' }, { status: 404 });
        }

        // 4. Check if already unlocked
        if (audit.isUnlocked) {
            console.log('[UNLOCK] Already unlocked');
            return Response.json({ success: true, alreadyUnlocked: true });
        }

        // 5. Check credits
        const availableCredits = await getAvailableCredits(user._id);
        console.log('[UNLOCK] Available credits:', availableCredits);
        if (availableCredits < 1) {
            return Response.json({ error: 'Insufficient credits' }, { status: 400 });
        }

        // 6. Consume credit
        console.log('[UNLOCK] Attempting to consume credit...');
        const creditResult = await consumeCredit(user._id, 1, auditId);
        console.log('[UNLOCK] Credit consumption result:', creditResult);
        if (!creditResult.success) {
            return Response.json({ error: creditResult.error || 'Credit deduction failed' }, { status: 400 });
        }

        // 7. Mark audit as unlocked
        console.log('[UNLOCK] Marking audit as unlocked...');
        audit.isUnlocked = true;
        audit.unlockedAt = new Date();
        audit.unlockedBy = user._id;
        await audit.save();
        console.log('[UNLOCK] Audit saved successfully');

        return Response.json({ success: true, creditsRemaining: creditResult.creditsRemaining });

    } catch (error) {
        console.error('[UNLOCK] ERROR:', error.message);
        console.error('[UNLOCK] Stack:', error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
