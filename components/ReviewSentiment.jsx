"use client";

import { analyzeBulkReviews, estimateSentimentFromRating, getSentimentInsights } from "@/libs/sentiment";
import { useState, useEffect } from "react";

export default function ReviewSentiment({ audit }) {
    const [sentiment, setSentiment] = useState(null);
    const [insights, setInsights] = useState(null);
    const [isEstimated, setIsEstimated] = useState(false);

    useEffect(() => {
        if (!audit) return;
        // Try to analyze real reviews if available
        if (audit.reviews && Array.isArray(audit.reviews) && audit.reviews.length > 0) {
            const analysis = analyzeBulkReviews(audit.reviews);
            setSentiment(analysis);
            setInsights(getSentimentInsights(analysis));
            setIsEstimated(false);
        } else if (audit.averageRating && audit.reviewCount) {
            // Fallback to estimation from rating
            const estimation = estimateSentimentFromRating(audit.averageRating, audit.reviewCount);
            setSentiment(estimation);
            setInsights(getSentimentInsights({ ...estimation, totalReviews: audit.reviewCount }));
            setIsEstimated(true);
        }
    }, [audit]);

    if (!sentiment) return null;

    const posPct = sentiment.positivePct || 0;
    const neuPct = sentiment.neutralPct || 0;
    const negPct = sentiment.negativePct || 0;

    return (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold font-serif text-slate-900">Review Sentiment</h3>
                {isEstimated && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                        Estimated · {audit.averageRating}★ avg
                    </span>
                )}
            </div>

            {insights && (
                <p className="text-sm text-slate-600 mb-6">{insights.message}</p>
            )}

            {/* Horizontal Stacked Bar */}
            <div className="w-full h-8 rounded-full overflow-hidden flex mb-6">
                <div style={{ width: `${posPct}%` }} className="bg-green-500 h-full transition-all duration-700"></div>
                <div style={{ width: `${neuPct}%` }} className="bg-slate-300 h-full transition-all duration-700"></div>
                <div style={{ width: `${negPct}%` }} className="bg-red-500 h-full transition-all duration-700"></div>
            </div>

            {/* Legend with counts */}
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
                <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600">Positive</span>
                    </div>
                    <span className="text-xl font-bold text-green-600">{posPct}%</span>
                    {sentiment.positive > 0 && (
                        <span className="text-xs text-slate-400">({sentiment.positive} reviews)</span>
                    )}
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600">Neutral</span>
                    </div>
                    <span className="text-xl font-bold text-slate-600">{neuPct}%</span>
                    {sentiment.neutral > 0 && (
                        <span className="text-xs text-slate-400">({sentiment.neutral} reviews)</span>
                    )}
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-600">Negative</span>
                    </div>
                    <span className="text-xl font-bold text-red-600">{negPct}%</span>
                    {sentiment.negative > 0 && (
                        <span className="text-xs text-slate-400">({sentiment.negative} reviews)</span>
                    )}
                </div>
            </div>

            {/* Owner Response Rate */}
            {audit.reviewCount > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-3">Owner Response Rate:</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-700"
                                    style={{ width: `${((audit.responseRate || 0) * 100).toFixed(0)}%` }}
                                ></div>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 min-w-[50px] text-right">
                            {((audit.responseRate || 0) * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                            <p className="text-[10px] text-slate-600 mb-1">Replied</p>
                            <p className="text-base font-bold text-green-700">
                                {Math.round((audit.responseRate || 0) * audit.reviewCount)}
                            </p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                            <p className="text-[10px] text-slate-600 mb-1">Not Replied</p>
                            <p className="text-base font-bold text-red-700">
                                {Math.round((1 - (audit.responseRate || 0)) * audit.reviewCount)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Top keywords if available */}
            {sentiment.topPositiveKeywords && sentiment.topPositiveKeywords.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Most mentioned positive terms:</p>
                    <div className="flex flex-wrap gap-2">
                        {sentiment.topPositiveKeywords.slice(0, 3).map((kw, i) => (
                            <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                                {kw.keyword}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommendations if status is not excellent */}
            {insights && insights.status !== 'excellent' && insights.recommendations && insights.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Key Actions:</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                        {insights.recommendations.slice(0, 2).map((rec, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
