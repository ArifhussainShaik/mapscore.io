/**
 * Sentiment Analysis Library
 *
 * Analyzes review text to determine sentiment (positive, neutral, negative)
 * Uses keyword-based scoring with weighted terms.
 *
 * This is a lightweight implementation that runs client-side.
 * For production, consider using an external API (OpenAI, Google NLP, etc.)
 */

// Positive keywords and their weights
const POSITIVE_KEYWORDS = {
    // Strong positive (weight: 2)
    "excellent": 2,
    "amazing": 2,
    "outstanding": 2,
    "exceptional": 2,
    "fantastic": 2,
    "wonderful": 2,
    "perfect": 2,
    "incredible": 2,
    "superb": 2,
    "brilliant": 2,
    "love": 2,
    "loved": 2,
    "highly recommend": 2,

    // Medium positive (weight: 1.5)
    "great": 1.5,
    "good": 1.5,
    "nice": 1.5,
    "friendly": 1.5,
    "helpful": 1.5,
    "professional": 1.5,
    "quality": 1.5,
    "recommend": 1.5,
    "satisfied": 1.5,
    "happy": 1.5,
    "pleased": 1.5,
    "impressed": 1.5,
    "best": 1.5,

    // Mild positive (weight: 1)
    "fine": 1,
    "decent": 1,
    "okay": 1,
    "fair": 1,
    "adequate": 1,
    "acceptable": 1,
    "reasonable": 1,
};

// Negative keywords and their weights (negative values)
const NEGATIVE_KEYWORDS = {
    // Strong negative (weight: -2)
    "terrible": -2,
    "horrible": -2,
    "awful": -2,
    "disgusting": -2,
    "worst": -2,
    "hate": -2,
    "hated": -2,
    "never again": -2,
    "do not recommend": -2,
    "don't recommend": -2,
    "avoid": -2,
    "scam": -2,
    "fraud": -2,
    "rude": -2,

    // Medium negative (weight: -1.5)
    "bad": -1.5,
    "poor": -1.5,
    "disappointed": -1.5,
    "disappointing": -1.5,
    "unprofessional": -1.5,
    "slow": -1.5,
    "late": -1.5,
    "expensive": -1.5,
    "overpriced": -1.5,
    "waste": -1.5,
    "regret": -1.5,

    // Mild negative (weight: -1)
    "mediocre": -1,
    "meh": -1,
    "lacking": -1,
    "missing": -1,
    "could be better": -1,
    "not great": -1,
    "not good": -1,
};

/**
 * Analyze a single review text
 *
 * @param {string} text - Review text to analyze
 * @returns {{ score: number, sentiment: 'positive'|'neutral'|'negative', confidence: number }}
 */
export function analyzeReviewText(text) {
    if (!text || typeof text !== 'string') {
        return { score: 0, sentiment: 'neutral', confidence: 0 };
    }

    const lowerText = text.toLowerCase();
    let score = 0;
    let matchedKeywords = 0;

    // Check for positive keywords
    for (const [keyword, weight] of Object.entries(POSITIVE_KEYWORDS)) {
        if (lowerText.includes(keyword)) {
            score += weight;
            matchedKeywords++;
        }
    }

    // Check for negative keywords
    for (const [keyword, weight] of Object.entries(NEGATIVE_KEYWORDS)) {
        if (lowerText.includes(keyword)) {
            score += weight; // weight is already negative
            matchedKeywords++;
        }
    }

    // Calculate confidence based on number of matches and text length
    const wordCount = text.split(/\s+/).length;
    const keywordDensity = matchedKeywords / Math.max(wordCount, 1);
    const confidence = Math.min(1, keywordDensity * 5 + (matchedKeywords > 0 ? 0.3 : 0));

    // Determine sentiment
    let sentiment;
    if (score > 0.5) {
        sentiment = 'positive';
    } else if (score < -0.5) {
        sentiment = 'negative';
    } else {
        sentiment = 'neutral';
    }

    return {
        score: Math.round(score * 100) / 100,
        sentiment,
        confidence: Math.round(confidence * 100) / 100,
    };
}

/**
 * Analyze an array of reviews
 *
 * @param {Array} reviews - Array of review objects with 'text' or 'comment' field
 * @returns {{
 *   positive: number,
 *   neutral: number,
 *   negative: number,
 *   positivePct: number,
 *   neutralPct: number,
 *   negativePct: number,
 *   totalReviews: number,
 *   avgScore: number,
 *   topPositiveKeywords: Array,
 *   topNegativeKeywords: Array
 * }}
 */
export function analyzeBulkReviews(reviews) {
    if (!Array.isArray(reviews) || reviews.length === 0) {
        return {
            positive: 0,
            neutral: 0,
            negative: 0,
            positivePct: 0,
            neutralPct: 0,
            negativePct: 0,
            totalReviews: 0,
            avgScore: 0,
            topPositiveKeywords: [],
            topNegativeKeywords: [],
        };
    }

    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let totalScore = 0;
    const keywordFrequency = {};

    reviews.forEach(review => {
        const text = review.text || review.comment || review.reviewText || '';
        const analysis = analyzeReviewText(text);

        totalScore += analysis.score;

        if (analysis.sentiment === 'positive') {
            positive++;
        } else if (analysis.sentiment === 'negative') {
            negative++;
        } else {
            neutral++;
        }

        // Track keyword frequency
        const lowerText = text.toLowerCase();
        [...Object.keys(POSITIVE_KEYWORDS), ...Object.keys(NEGATIVE_KEYWORDS)].forEach(keyword => {
            if (lowerText.includes(keyword)) {
                keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
            }
        });
    });

    const total = reviews.length;
    const avgScore = totalScore / total;

    // Get top keywords
    const sortedKeywords = Object.entries(keywordFrequency)
        .sort((a, b) => b[1] - a[1]);

    const topPositiveKeywords = sortedKeywords
        .filter(([keyword]) => POSITIVE_KEYWORDS[keyword])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

    const topNegativeKeywords = sortedKeywords
        .filter(([keyword]) => NEGATIVE_KEYWORDS[keyword])
        .slice(0, 5)
        .map(([keyword, count]) => ({ keyword, count }));

    return {
        positive,
        neutral,
        negative,
        positivePct: Math.round((positive / total) * 100),
        neutralPct: Math.round((neutral / total) * 100),
        negativePct: Math.round((negative / total) * 100),
        totalReviews: total,
        avgScore: Math.round(avgScore * 100) / 100,
        topPositiveKeywords,
        topNegativeKeywords,
    };
}

/**
 * Estimate sentiment distribution from star ratings
 * This is a fallback when review text is not available
 *
 * @param {number} avgRating - Average star rating (1-5)
 * @param {number} reviewCount - Total number of reviews
 * @returns {{ positive: number, neutral: number, negative: number, positivePct: number, neutralPct: number, negativePct: number }}
 */
export function estimateSentimentFromRating(avgRating, reviewCount) {
    if (!avgRating || !reviewCount) {
        return {
            positive: 0,
            neutral: 0,
            negative: 0,
            positivePct: 0,
            neutralPct: 0,
            negativePct: 0,
        };
    }

    const avg = Math.min(5, Math.max(1, avgRating));
    let dist;

    // Distribution based on average rating
    // [1-star%, 2-star%, 3-star%, 4-star%, 5-star%]
    if (avg >= 4.5) dist = [0.01, 0.02, 0.04, 0.13, 0.80];
    else if (avg >= 4.0) dist = [0.03, 0.04, 0.08, 0.25, 0.60];
    else if (avg >= 3.5) dist = [0.06, 0.08, 0.16, 0.30, 0.40];
    else if (avg >= 3.0) dist = [0.10, 0.12, 0.23, 0.28, 0.27];
    else if (avg >= 2.5) dist = [0.18, 0.18, 0.24, 0.22, 0.18];
    else dist = [0.30, 0.22, 0.20, 0.16, 0.12];

    // Negative = 1-2 stars
    const negativePct = Math.round((dist[0] + dist[1]) * 100);
    const negative = Math.round((dist[0] + dist[1]) * reviewCount);

    // Neutral = 3 stars
    const neutralPct = Math.round(dist[2] * 100);
    const neutral = Math.round(dist[2] * reviewCount);

    // Positive = 4-5 stars
    const positivePct = Math.round((dist[3] + dist[4]) * 100);
    const positive = Math.round((dist[3] + dist[4]) * reviewCount);

    return {
        positive,
        neutral,
        negative,
        positivePct,
        neutralPct,
        negativePct,
    };
}

/**
 * Get sentiment insights and recommendations
 *
 * @param {{ positivePct: number, negativePct: number, neutralPct: number, totalReviews: number }} sentiment
 * @returns {{ status: string, message: string, recommendations: Array<string> }}
 */
export function getSentimentInsights(sentiment) {
    const { positivePct, negativePct, neutralPct, totalReviews } = sentiment;

    let status = 'good';
    let message = '';
    const recommendations = [];

    if (positivePct >= 80) {
        status = 'excellent';
        message = 'Your sentiment is overwhelmingly positive. Keep up the great work!';
        recommendations.push('Continue delivering excellent service');
        recommendations.push('Ask happy customers to share their experience');
    } else if (positivePct >= 60) {
        status = 'good';
        message = 'Most customers are happy with your service.';
        recommendations.push('Address negative feedback promptly');
        recommendations.push('Encourage more reviews from satisfied customers');
    } else if (positivePct >= 40) {
        status = 'fair';
        message = 'Mixed reviews indicate room for improvement.';
        recommendations.push('Analyze negative feedback for patterns');
        recommendations.push('Improve customer service processes');
        recommendations.push('Respond to all reviews professionally');
    } else {
        status = 'poor';
        message = 'Sentiment analysis shows significant customer dissatisfaction.';
        recommendations.push('URGENT: Review and address negative feedback');
        recommendations.push('Implement quality control measures');
        recommendations.push('Consider hiring a reputation management consultant');
        recommendations.push('Respond to every negative review with solutions');
    }

    if (negativePct > 20) {
        recommendations.push('High negative sentiment - prioritize service improvements');
    }

    if (neutralPct > 30) {
        recommendations.push('Many neutral reviews - work to exceed expectations');
    }

    if (totalReviews < 10) {
        recommendations.push('Need more reviews for accurate sentiment analysis');
    }

    return { status, message, recommendations };
}
