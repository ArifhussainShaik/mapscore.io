"use client";

import { useState } from "react";

/**
 * SEOChecklist - Local SEO Readiness Checklist
 * 15-item checklist based on audit data
 * Shows what's done and what needs attention
 */

const CHECKLIST_ITEMS = [
    {
        id: 'gbp_verified',
        category: 'Profile Setup',
        label: 'Google Business Profile Verified',
        check: (audit) => audit.googlePlaceId && audit.businessName,
        importance: 'critical',
        tip: 'Your GBP is claimed and verified',
        fixTip: 'Claim and verify your Google Business Profile immediately',
    },
    {
        id: 'primary_category',
        category: 'Profile Setup',
        label: 'Primary Category Set',
        check: (audit) => !!audit.primaryCategory,
        importance: 'critical',
        tip: 'Primary category is properly set',
        fixTip: 'Choose your most relevant primary category',
    },
    {
        id: 'secondary_categories',
        category: 'Profile Setup',
        label: 'Multiple Categories Listed',
        check: (audit) => (audit.secondaryCategories?.length || 0) >= 2,
        importance: 'high',
        tip: '3+ categories help you appear in more searches',
        fixTip: 'Add 2-3 relevant secondary categories',
    },
    {
        id: 'business_description',
        category: 'Content',
        label: 'Business Description Complete',
        check: (audit) => (audit.description?.length || 0) >= 200,
        importance: 'high',
        tip: 'Strong description with keywords',
        fixTip: 'Write a 500-750 character description with location and service keywords',
    },
    {
        id: 'services_listed',
        category: 'Content',
        label: 'Services Listed (5+)',
        check: (audit) => (audit.services?.length || 0) >= 5,
        importance: 'high',
        tip: 'Services section is well populated',
        fixTip: 'Add at least 5-10 services with descriptions',
    },
    {
        id: 'business_hours',
        category: 'Profile Setup',
        label: 'Business Hours Complete',
        check: (audit) => audit.hours && Object.keys(audit.hours).length >= 6,
        importance: 'medium',
        tip: 'Hours are set for all days',
        fixTip: 'Add business hours for all 7 days',
    },
    {
        id: 'phone_number',
        category: 'Contact Info',
        label: 'Phone Number Listed',
        check: (audit) => !!audit.phone,
        importance: 'critical',
        tip: 'Phone number is visible',
        fixTip: 'Add a local phone number',
    },
    {
        id: 'website_linked',
        category: 'Contact Info',
        label: 'Website Linked',
        check: (audit) => !!audit.websiteUrl,
        importance: 'high',
        tip: 'Website is linked to profile',
        fixTip: 'Add your website URL',
    },
    {
        id: 'photos_uploaded',
        category: 'Visual Content',
        label: 'Photos (15+ Images)',
        check: (audit) => (audit.photoCount || 0) >= 15,
        importance: 'high',
        tip: 'Strong photo gallery with 15+ photos',
        fixTip: 'Upload at least 15 high-quality photos',
    },
    {
        id: 'logo_uploaded',
        category: 'Visual Content',
        label: 'Logo Uploaded',
        check: (audit) => audit.hasLogo === true,
        importance: 'medium',
        tip: 'Logo is set',
        fixTip: 'Upload a high-quality logo (250×250px minimum)',
    },
    {
        id: 'cover_photo',
        category: 'Visual Content',
        label: 'Cover Photo Set',
        check: (audit) => audit.hasCoverPhoto === true,
        importance: 'medium',
        tip: 'Cover photo is set',
        fixTip: 'Upload a cover photo (1024×576px recommended)',
    },
    {
        id: 'reviews_active',
        category: 'Reputation',
        label: 'Active Reviews (10+)',
        check: (audit) => (audit.reviewCount || 0) >= 10,
        importance: 'high',
        tip: 'Healthy review count',
        fixTip: 'Encourage customers to leave reviews',
    },
    {
        id: 'review_responses',
        category: 'Reputation',
        label: 'Responding to Reviews',
        check: (audit) => (audit.responseRate || 0) >= 0.3,
        importance: 'medium',
        tip: 'Good review response rate',
        fixTip: 'Respond to at least 50% of your reviews',
    },
    {
        id: 'posts_regular',
        category: 'Engagement',
        label: 'Regular Google Posts',
        check: (audit) => (audit.postsPerMonth || 0) >= 1,
        importance: 'medium',
        tip: 'Posting regularly to GBP',
        fixTip: 'Post at least 1-2 times per month',
    },
    {
        id: 'website_mobile',
        category: 'Technical SEO',
        label: 'Mobile-Friendly Website',
        check: (audit) => audit.websiteMobile === true,
        importance: 'high',
        tip: 'Website is mobile-friendly',
        fixTip: 'Optimize your website for mobile devices',
    },
];

export default function SEOChecklist({ audit }) {
    const [expandedCategory, setExpandedCategory] = useState(null);

    if (!audit) return null;

    // Evaluate all items
    const evaluatedItems = CHECKLIST_ITEMS.map(item => ({
        ...item,
        passed: item.check(audit),
    }));

    // Group by category
    const categories = {};
    evaluatedItems.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });

    // Calculate stats
    const totalItems = evaluatedItems.length;
    const passedItems = evaluatedItems.filter(i => i.passed).length;
    const criticalPassed = evaluatedItems.filter(i => i.importance === 'critical' && i.passed).length;
    const criticalTotal = evaluatedItems.filter(i => i.importance === 'critical').length;
    const completionPct = Math.round((passedItems / totalItems) * 100);

    // SEO readiness score
    let readinessLevel = 'Poor';
    let readinessColor = 'red';
    if (completionPct >= 90) {
        readinessLevel = 'Excellent';
        readinessColor = 'green';
    } else if (completionPct >= 75) {
        readinessLevel = 'Good';
        readinessColor = 'blue';
    } else if (completionPct >= 60) {
        readinessLevel = 'Fair';
        readinessColor = 'amber';
    } else if (completionPct >= 40) {
        readinessLevel = 'Needs Work';
        readinessColor = 'orange';
    }

    return (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
            <div className="mb-6">
                <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">
                    Local SEO Readiness
                </h3>
                <p className="text-sm text-slate-600">
                    15-point checklist for local search optimization
                </p>
            </div>

            {/* Overall Score */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className={`text-3xl font-black text-${readinessColor}-600 mb-1`}>
                            {completionPct}%
                        </div>
                        <div className="text-sm font-semibold text-slate-700">
                            SEO Readiness: {readinessLevel}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-slate-700">
                            {passedItems}/{totalItems}
                        </div>
                        <div className="text-xs text-slate-500">items complete</div>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-3 rounded-full transition-all duration-700 bg-${readinessColor}-500`}
                        style={{ width: `${completionPct}%` }}
                    />
                </div>

                {/* Critical items warning */}
                {criticalPassed < criticalTotal && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-semibold">
                            ⚠ {criticalTotal - criticalPassed} critical item{criticalTotal - criticalPassed !== 1 ? 's' : ''} need{criticalTotal - criticalPassed === 1 ? 's' : ''} immediate attention
                        </p>
                    </div>
                )}
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
                {Object.entries(categories).map(([categoryName, items]) => {
                    const categoryPassed = items.filter(i => i.passed).length;
                    const categoryTotal = items.length;
                    const categoryPct = Math.round((categoryPassed / categoryTotal) * 100);
                    const isExpanded = expandedCategory === categoryName;

                    return (
                        <div key={categoryName} className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Category Header */}
                            <button
                                onClick={() => setExpandedCategory(isExpanded ? null : categoryName)}
                                className="w-full p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">
                                        {isExpanded ? '▼' : '▶'}
                                    </span>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-900">{categoryName}</div>
                                        <div className="text-xs text-slate-500">
                                            {categoryPassed}/{categoryTotal} complete
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 h-2 bg-white rounded-full overflow-hidden">
                                        <div
                                            className="h-2 bg-blue-500 transition-all duration-500"
                                            style={{ width: `${categoryPct}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 min-w-[45px] text-right">
                                        {categoryPct}%
                                    </span>
                                </div>
                            </button>

                            {/* Category Items */}
                            {isExpanded && (
                                <div className="p-4 bg-white space-y-2">
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                                item.passed ? 'bg-green-50' : 'bg-red-50'
                                            }`}
                                        >
                                            <span className="text-lg flex-shrink-0">
                                                {item.passed ? '✅' : '❌'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-semibold text-sm ${
                                                        item.passed ? 'text-green-700' : 'text-red-700'
                                                    }`}>
                                                        {item.label}
                                                    </span>
                                                    {item.importance === 'critical' && (
                                                        <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded">
                                                            CRITICAL
                                                        </span>
                                                    )}
                                                    {item.importance === 'high' && (
                                                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold rounded">
                                                            HIGH
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-600">
                                                    {item.passed ? item.tip : item.fixTip}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            {passedItems < totalItems && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3">
                        Quick Wins (Complete These First):
                    </h4>
                    <ul className="space-y-2">
                        {evaluatedItems
                            .filter(i => !i.passed && (i.importance === 'critical' || i.importance === 'high'))
                            .slice(0, 3)
                            .map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                    <span className="text-blue-500 mt-0.5 font-bold">{idx + 1}.</span>
                                    <span className="text-slate-700">{item.fixTip}</span>
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            {/* Info Footer */}
            <div className="mt-6 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                    This checklist is based on Google&apos;s local SEO best practices and ranking factors.
                    Completing all items will significantly improve your local search visibility and rankings.
                </p>
            </div>
        </div>
    );
}
