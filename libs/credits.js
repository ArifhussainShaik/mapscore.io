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
 * Deducts 1 credit from the user's oldest valid batch.
 * Uses atomic MongoDB operations ($inc) to prevent race conditions during concurrent unlocks.
 * @returns {boolean} true if successful, false if insufficient credits.
 */
export async function useCredit(userId) {
    await connectMongo();
    const user = await User.findById(userId);
    if (!user) return false;

    // 1. Find the oldest valid batch (FIFO)
    const validBatches = getValidCreditHistory(user)
        .sort((a, b) => new Date(a.purchaseDate) - new Date(b.purchaseDate));

    if (validBatches.length === 0) {
        return false; // No valid credits
    }

    const batchToUseId = validBatches[0]._id;

    // 2. ATOMIC UPDATE: Decrement top-level credits, increment used, and decrement the specific batch
    // Using FindOneAndUpdate ensures two rapid clicks don't deduct the same credit instance.
    const result = await User.findOneAndUpdate(
        {
            _id: userId,
            "creditHistory._id": batchToUseId,
            "creditHistory.creditsRemaining": { $gt: 0 }, // Safety guard
            credits: { $gt: 0 } // Safety guard
        },
        {
            $inc: {
                credits: -1,
                creditsUsed: 1,
                "creditHistory.$.creditsRemaining": -1
            }
        },
        { new: true } // Return updated doc
    );

    return !!result; // Return true if atomic update succeeded
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
