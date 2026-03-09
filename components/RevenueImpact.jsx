"use client";

import { useState } from "react";

export default function RevenueImpact({ audit }) {
    const [avgCustomerValue, setAvgCustomerValue] = useState(150);

    if (!audit) return null;

    // 1. Calculate Competitor Average Reviews
    const competitors = audit.competitors || [];

    // Don't render if no competitor data — would show misleading $0
    if (competitors.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider w-max mb-4">
                    Revenue Leak
                </span>
                <h3 className="text-xl font-bold text-slate-700 mb-2 font-serif">Revenue Impact Unavailable</h3>
                <p className="text-sm text-slate-500">
                    Competitor data could not be retrieved for your area. Re-run the audit to calculate your estimated revenue impact.
                </p>
            </div>
        );
    }
    let avgCompetitorReviews = 0;

    if (competitors.length > 0) {
        const totalCompetitorReviews = competitors.reduce((sum, comp) => sum + (comp.reviewCount || 0), 0);
        avgCompetitorReviews = Math.round(totalCompetitorReviews / competitors.length);
    }

    const businessReviews = audit.reviewCount || 0;

    // 2. Calculate the Gap (Floor at 0 if business is winning)
    const reviewGap = Math.max(0, avgCompetitorReviews - businessReviews);

    // 3. Apply the Formula
    // 5% conversion rate on the missing reviews (assuming each review represents a certain volume of lost customers who chose competitors)
    const monthlyLostCustomers = Math.round(reviewGap * 0.05);
    const annualLostCustomers = monthlyLostCustomers * 12;
    const annualRevenueLoss = annualLostCustomers * avgCustomerValue;

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Left Side: The Hook & Calculation */}
            <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/50">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider w-max mb-6">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    Revenue Leak
                </span>

                <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-2 font-serif">
                    You could be losing <br />
                    <span className="text-red-500">${annualRevenueLoss.toLocaleString()}</span> <span className="text-2xl text-slate-500 font-sans font-medium">/ year</span>
                </h3>

                <p className="text-slate-600 text-base mb-8">
                    Based on your review gap against the top competitors in your area.
                </p>

                <div className="space-y-4 text-sm font-medium text-slate-600 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center">
                        <span>Top Competitor Avg. Reviews</span>
                        <span className="font-bold text-slate-900">{avgCompetitorReviews}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>Your Reviews</span>
                        <span className="font-bold text-slate-900">{businessReviews}</span>
                    </div>
                    <div className="w-full h-px bg-slate-100 my-2"></div>
                    <div className="flex justify-between items-center text-red-600 font-bold">
                        <span>Review Deficit</span>
                        <span>-{reviewGap}</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Interactive Controls */}
            <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-center bg-white">
                <div className="mb-6">
                    <h4 className="text-lg font-bold text-slate-900 mb-1">Calculate Your Value</h4>
                    <p className="text-sm text-slate-500">
                        Adjust the slider below to see how much a single customer is worth to your business annually.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Input Control */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                Avg. Customer Value ($)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    min="10"
                                    max="5000"
                                    value={avgCustomerValue}
                                    onChange={(e) => setAvgCustomerValue(Number(e.target.value) || 0)}
                                    className="input input-bordered input-md w-28 pl-7 text-lg font-bold text-emerald-700 bg-emerald-50 border-emerald-200 focus:outline-emerald-500"
                                />
                            </div>
                        </div>

                        {/* Range Slider */}
                        <input
                            type="range"
                            min="10"
                            max="5000"
                            value={avgCustomerValue}
                            onChange={(e) => setAvgCustomerValue(Number(e.target.value))}
                            className="range range-primary range-sm"
                            style={{ '--range-shdw': '#10b981' }} // Emerald tailwind override
                        />
                        <div className="w-full flex justify-between text-xs px-1 text-slate-400 mt-2 font-medium">
                            <span>$10</span>
                            <span>$2,500</span>
                            <span>$5,000+</span>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-6">
                        <div className="flex gap-3">
                            <div className="text-blue-500 text-xl font-serif">i</div>
                            <p className="text-xs text-blue-700/80 leading-relaxed font-medium">
                                * Methodology: Estimate based on a conservative 5% review-to-customer conversion rate assumption. Local consumers overwhelmingly choose businesses with higher review volumes over competitors lacking social proof.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
