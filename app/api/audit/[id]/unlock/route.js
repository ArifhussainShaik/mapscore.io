import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Audit from "@/models/Audit";
import { getAvailableCredits, consumeCredit } from "@/libs/credits";
import connectMongo from "@/libs/mongoose";

export async function POST(req, { params }) {
    console.log('[UNLOCK] === Starting unlock process ===');

    try {
        // 1. Session check
        const session = await getServerSession(authOptions);
        if (!session) {
            return Response.json({ error: 'Not authenticated' }, { status: 401 });
        }

        // 2. Get user
        await connectMongo();
        const User = (await import("@/models/User")).default;
        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return Response.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Get audit — enforce ownership so users can't unlock each other's audits
        const { id: auditId } = await params;
        const audit = await Audit.findOne({ _id: auditId, userId: user._id });
        if (!audit) {
            return Response.json({ error: 'Audit not found or access denied' }, { status: 404 });
        }

        // 4. Already unlocked — idempotent, no credit needed
        if (audit.isUnlocked) {
            return Response.json({ success: true, alreadyUnlocked: true });
        }

        // 5. Check credits
        const availableCredits = await getAvailableCredits(user._id);
        if (availableCredits < 1) {
            return Response.json({ error: 'Insufficient credits', code: 'NO_CREDITS' }, { status: 400 });
        }

        // 6. Atomic guard — mark as unlocked only if it hasn't been unlocked yet.
        //    This prevents a race condition where two rapid clicks both pass step 4
        //    and both consume a credit.
        const claimed = await Audit.findOneAndUpdate(
            { _id: auditId, isUnlocked: false },
            { $set: { isUnlocked: true, unlockedAt: new Date(), unlockedBy: user._id } },
            { new: false } // return original doc — if null, someone else beat us to it
        );

        if (!claimed) {
            // Another request already unlocked it between our check and now
            return Response.json({ success: true, alreadyUnlocked: true });
        }

        // 7. Consume credit (after atomic lock is secured)
        const creditResult = await consumeCredit(user._id, 1, auditId);
        if (!creditResult.success) {
            // Roll back the unlock if credit deduction fails
            await Audit.findByIdAndUpdate(auditId, {
                $set: { isUnlocked: false, unlockedAt: null, unlockedBy: null }
            });
            return Response.json({ error: creditResult.error || 'Credit deduction failed' }, { status: 400 });
        }

        console.log('[UNLOCK] Success. Credits remaining:', creditResult.creditsRemaining);
        return Response.json({ success: true, creditsRemaining: creditResult.creditsRemaining });

    } catch (error) {
        console.error('[UNLOCK] ERROR:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
