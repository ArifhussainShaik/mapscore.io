// Check if user can run audit
export function canRunAudit(user) {
    if (user.is_lifetime) {
        refreshLifetimeCreditsIfNeeded(user);
        return user.credits > 0;
    }

    // Remove expired credits first
    removeExpiredCredits(user);

    return user.credits > 0;
}

// Deduct 1 credit (FIFO - oldest first)
export async function deductCredit(user) {
    if (user.is_lifetime) {
        user.credits -= 1;
        user.total_audits_run += 1;
        await user.save();
        return;
    }

    // Find oldest non-expired purchase with remaining credits
    const now = new Date();
    for (let purchase of user.credit_purchases) {
        if (purchase.remaining > 0 && new Date(purchase.expires_at) > now) {
            purchase.remaining -= 1;
            user.credits -= 1;
            user.total_audits_run += 1;
            await user.save();
            break;
        }
    }
}

// Add credits from purchase
export async function addCredits(user, amount, packageType, price) {
    const purchase = {
        amount: amount,
        remaining: amount,
        purchased_at: new Date(),
        expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        package: packageType,
        price_paid: price
    };

    user.credit_purchases.push(purchase);
    user.credits += amount;
    await user.save();
}

// Refresh LTD credits on 1st of month
export function refreshLifetimeCreditsIfNeeded(user) {
    const now = new Date();
    const resetDate = user.lifetime_credits_reset_date;

    if (!resetDate || now.getMonth() !== new Date(resetDate).getMonth() || now.getFullYear() !== new Date(resetDate).getFullYear()) {
        user.credits = user.lifetime_monthly_credits || 30; // Reset to 30
        user.lifetime_credits_reset_date = now;
    }
}

// Remove expired credits
export function removeExpiredCredits(user) {
    const now = new Date();
    let expiredCount = 0;
    let hasExpired = false;

    user.credit_purchases = user.credit_purchases.filter(p => {
        if (new Date(p.expires_at) <= now && p.remaining > 0) {
            expiredCount += p.remaining;
            hasExpired = true;
            return false; // Remove fully expired entries
        }
        return true;
    });

    if (hasExpired) {
        user.credits = Math.max(0, user.credits - expiredCount);
    }
}
