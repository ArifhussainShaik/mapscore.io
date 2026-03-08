/**
 * Neighborhood Standings — Calculate business ranking among local competitors.
 *
 * Uses a weighted scoring formula to determine where a business stands
 * relative to its nearby competitors from Google Map Pack results.
 */

/**
 * Calculate a profile strength score for a business.
 *
 * Weights:
 *   - Review count: 30%
 *   - Rating: 20%
 *   - Photo count: 15%
 *   - Category count: 10%
 *   - Post activity: 15%
 *   - Website presence: 10%
 *
 * @param {Object} profile
 * @returns {number} Score (higher is better)
 */
export function getProfileScore(profile) {
    const reviewCount = profile.reviewCount || profile.ratingCount || 0;
    const rating = profile.rating || 0;
    const photoCount = profile.photoCount || 0;
    const categoryCount = profile.categories?.length || (profile.category ? 1 : 0);
    const postActivity = profile.postActivity === "active" ? 10
        : profile.postActivity === "moderate" ? 5
            : 0;
    const hasWebsite = profile.websiteUrl || profile.website ? 10 : 0;

    return (
        (reviewCount * 0.3) +
        (rating * 20 * 0.2) +
        (photoCount * 0.15) +
        (categoryCount * 5 * 0.1) +
        (postActivity * 0.15) +
        (hasWebsite * 0.1)
    );
}

/**
 * Calculate a business's standing among competitors.
 *
 * @param {Object} business - The user's business data
 * @param {Array} competitors - Array of competitor profiles
 * @returns {{ standing: number, totalCompared: number, allScores: Array }}
 */
export function calculateStanding(business, competitors) {
    const userScore = getProfileScore(business);

    const allScores = [
        { name: business.businessName || business.name, score: userScore, isUser: true },
        ...competitors.map(c => ({
            name: c.name || c.title,
            score: getProfileScore(c),
            isUser: false,
        })),
    ];

    // Sort by score descending (best first)
    allScores.sort((a, b) => b.score - a.score);

    // Find user's 1-indexed position
    const standing = allScores.findIndex(s => s.isUser) + 1;

    return {
        standing,
        totalCompared: allScores.length,
        allScores,
    };
}
