import User from "@/models/User";
import connectMongo from "./mongoose";

/**
 * CORE COMPONENT OF LOCALSCORE BILLING.
 * Handles the Pay-As-You-Go credit system.
 * 1 Credit = 1 Full Audit Unlock.
 */

// Helper to filter out expired credits
function getValidCreditHistory(user) {
    if (!user || !user.creditHistory) return [];
    const now = new Date();
    return user.creditHistory.filter(
        batch => batch.creditsRemaining > 0 && new Date(batch.expiryDate) > now
    );
}

/**
 * Returns the total number of valid (non-expired, non-empty) credits a user has.
 * Re-calculates dynamically from the history array to guarantee expiry logic.
 */
export async function getAvailableCredits(userId) {
    await connectMongo();
    const user = await User.findById(userId);
    if (!user) return 0;

    const validBatches = getValidCreditHistory(user);
    const totalCredits = validBatches.reduce((sum, batch) => sum + batch.creditsRemaining, 0);

    // Sync the top-level credits field if it drifted due to expiries
    if (user.credits !== totalCredits) {
        user.credits = totalCredits;
        await user.save();
    }

    return totalCredits;
}

/**
 * Atomically deducts 1 credit from the user's oldest valid batch.
 *
 * @param {string} userId
 * @returns {Promise<boolean>} True if successful, false if insufficient credits or error.
 */
export async function consumeCredit(userId, amount = 1, auditId = null) {
    console.log('[CREDITS] consumeCredit called:', { userId, amount, auditId });

    try {
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Check available credits
        const available = await getAvailableCredits(userId);
        console.log('[CREDITS] Available before deduction:', available);
        if (available < amount) {
            return { success: false, error: 'Insufficient credits' };
        }

        // FIFO: Find oldest non-expired credit with remaining balance
        const now = new Date();
        let remaining = amount;

        for (let credit of user.creditHistory) {
            if (remaining <= 0) break;
            if (credit.expiryDate > now && credit.creditsRemaining > 0) {
                const deduct = Math.min(credit.creditsRemaining, remaining);
                credit.creditsRemaining -= deduct;
                remaining -= deduct;
                console.log('[CREDITS] Deducted', deduct, 'from credit pack, remaining:', credit.creditsRemaining);
            }
        }

        // Update user
        user.creditsUsed = (user.creditsUsed || 0) + amount;
        user.credits = (user.credits || 0) - amount;
        await user.save();

        console.log('[CREDITS] User saved, new balance:', user.credits);

        return {
            success: true,
            creditsRemaining: user.credits
        };

    } catch (error) {
        console.error('[CREDITS] Error in consumeCredit:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Adds a new batch of credits to the user.
 * Defaults to 1-year expiry.
 */
export async function addCredits(userId, amount, packageType, transactionId = null) {
    await connectMongo();

    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Exact 1 year expiry

    const newBatch = {
        purchaseDate,
        creditsAdded: amount,
        expiryDate,
        creditsRemaining: amount,
        packageType,
        transactionId
    };

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $push: { creditHistory: newBatch },
            $inc: { credits: amount }
        },
        { new: true }
    );

    return user;
}

/**
 * Optional Utility to find credits expiring within 30 days.
 * Useful for cron jobs sending warning emails.
 */
export async function getExpiringCredits(userId) {
    await connectMongo();
    const user = await User.findById(userId);
    if (!user) return 0;

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const validBatches = getValidCreditHistory(user);
    const expiringBatches = validBatches.filter(
        batch => new Date(batch.expiryDate) <= thirtyDaysFromNow
    );

    return expiringBatches.reduce((sum, batch) => sum + batch.creditsRemaining, 0);
}
