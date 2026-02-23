"use client";

const CHECK_ITEMS = [
    {
        label: "Business Name",
        key: "businessName",
        check: (d) => !!d.businessName,
        tip: "Your business name is set correctly.",
        fixTip: "Add your business name to your Google Business Profile.",
    },
    {
        label: "Primary Category",
        key: "primaryCategory",
        check: (d) => !!d.primaryCategory,
        tip: "Your primary category is set.",
        fixTip: "Choose the most relevant primary category for your business type.",
    },
    {
        label: "Secondary Categories (3+)",
        key: "secondaryCategories",
        check: (d) => (d.secondaryCategories?.length || 0) >= 3,
        partial: (d) => (d.secondaryCategories?.length || 0) > 0,
        tip: "You have 3+ secondary categories — great for visibility.",
        fixTip: "Add at least 3 relevant secondary categories to appear in more searches.",
    },
    {
        label: "Business Description",
        key: "description",
        check: (d) => (d.description?.length || 0) >= 250,
        partial: (d) => !!d.description,
        tip: "Strong description with good length and keywords.",
        fixTip: "Write a 500-750 character description with service keywords and your city.",
    },
    {
        label: "Phone Number",
        key: "phone",
        check: (d) => !!d.phone,
        tip: "Phone number is listed.",
        fixTip: "Add a local phone number to your profile.",
    },
    {
        label: "Website Linked",
        key: "websiteUrl",
        check: (d) => !!d.websiteUrl,
        tip: "Website is linked to your profile.",
        fixTip: "Link your website to enable the website button on your profile.",
    },
    {
        label: "Business Hours",
        key: "hours",
        check: (d) => d.hours && Object.keys(d.hours).length >= 5,
        partial: (d) => d.hours && Object.keys(d.hours).length > 0,
        tip: "Business hours are set for most days.",
        fixTip: "Set your hours for all 7 days. Extended hours improve visibility.",
    },
    {
        label: "Services Listed (5+)",
        key: "services",
        check: (d) => (d.services?.length || 0) >= 5,
        partial: (d) => (d.services?.length || 0) > 0,
        tip: "Services section is well-populated.",
        fixTip: "Add at least 5-10 services with descriptions. This directly impacts rankings.",
    },
    {
        label: "Logo Uploaded",
        key: "hasLogo",
        check: (d) => d.hasLogo === true,
        tip: "Logo is uploaded.",
        fixTip: "Upload a high-quality logo (250×250px minimum).",
    },
    {
        label: "Cover Photo Set",
        key: "hasCoverPhoto",
        check: (d) => d.hasCoverPhoto === true,
        tip: "Cover photo is set.",
        fixTip: "Upload an eye-catching cover photo (1024×576px recommended).",
    },
    {
        label: "Photos (20+)",
        key: "photoCount",
        check: (d) => (d.photoCount || 0) >= 20,
        partial: (d) => (d.photoCount || 0) >= 5,
        tip: "Strong photo gallery with 20+ photos.",
        fixTip: "Upload at least 20 high-quality photos: interior, exterior, team, and work.",
    },
    {
        label: "Google Maps URL",
        key: "googleMapsUrl",
        check: (d) => !!d.googleMapsUrl,
        tip: "Your profile has a Google Maps listing.",
        fixTip: "Ensure your business is verified on Google Maps.",
    },
];

export default function ProfileChecklist({ audit }) {
    if (!audit) return null;

    const results = CHECK_ITEMS.map((item) => {
        const passed = item.check(audit);
        const partial = !passed && item.partial ? item.partial(audit) : false;
        return { ...item, passed, partial };
    });

    const passedCount = results.filter((r) => r.passed).length;
    const partialCount = results.filter((r) => r.partial).length;
    const total = results.length;
    const pct = Math.round((passedCount / total) * 100);

    return (
        <div className="glass-card overflow-hidden">
            <div className="p-5 border-b border-base-content/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            ✅ Profile Completeness
                        </h3>
                        <p className="text-sm text-base-content/50 mt-1">
                            How complete is your Google Business Profile
                        </p>
                    </div>
                    <div className="text-right">
                        <span
                            className={`text-3xl font-black ${pct >= 80
                                    ? "text-emerald-400"
                                    : pct >= 50
                                        ? "text-amber-400"
                                        : "text-red-400"
                                }`}
                        >
                            {pct}%
                        </span>
                        <p className="text-xs text-base-content/40 mt-0.5">
                            {passedCount}/{total} items
                            {partialCount > 0 && `, ${partialCount} partial`}
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-base-content/10 rounded-full h-2.5 mt-4">
                    <div
                        className="h-2.5 rounded-full transition-all duration-1000 ease-out"
                        style={{
                            width: `${pct}%`,
                            backgroundColor:
                                pct >= 80
                                    ? "#10b981"
                                    : pct >= 50
                                        ? "#f59e0b"
                                        : "#ef4444",
                        }}
                    />
                </div>
            </div>

            {/* Checklist items */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.map((item) => (
                    <div
                        key={item.key}
                        className={`flex items-start gap-2.5 p-2.5 rounded-lg text-sm transition-colors ${item.passed
                                ? "bg-emerald-500/5"
                                : item.partial
                                    ? "bg-amber-500/5"
                                    : "bg-red-500/5"
                            }`}
                    >
                        <span className="flex-shrink-0 mt-0.5 text-base">
                            {item.passed ? "✅" : item.partial ? "⚠️" : "❌"}
                        </span>
                        <div className="min-w-0">
                            <span
                                className={`font-medium ${item.passed
                                        ? "text-emerald-400"
                                        : item.partial
                                            ? "text-amber-400"
                                            : "text-red-400"
                                    }`}
                            >
                                {item.label}
                            </span>
                            <p className="text-xs text-base-content/40 mt-0.5 line-clamp-2">
                                {item.passed ? item.tip : item.fixTip}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
