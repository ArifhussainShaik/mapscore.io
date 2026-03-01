"use client";

// Helper components for SVG icons to avoid external stylesheet dependencies
const IconSwords = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.46 4.54L17.79 2.87C17.41 2.5 16.79 2.5 16.41 2.87L11.5 7.78L7.96 4.24C7.58 3.86 6.96 3.86 6.58 4.24L4.91 5.91C4.54 6.29 4.54 6.91 4.91 7.29L8.45 10.83L2.83 16.45C2.45 16.83 2.45 17.45 2.83 17.83L4.24 19.24C4.62 19.62 5.24 19.62 5.62 19.24L11.24 13.62L14.78 17.16C15.16 17.54 15.78 17.54 16.16 17.16L17.83 15.49C18.21 15.11 18.21 14.49 17.83 14.11L14.29 10.57L19.2 5.66C19.58 5.28 19.58 4.66 19.46 4.54z" />
    </svg>
);

const IconNearMe = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21 3L3 10.53V11.5L9.84 14.16L12.5 21H13.47L21 3z" />
    </svg>
);

const IconTrophy = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 5H17V3H7V5H5C3.9 5 3 5.9 3 7V9C3 11.21 4.79 13 7 13H8.56C9.28 14.71 10.86 16.03 12.82 16.29V19H10V21H14V19H11.18V16.29C13.14 16.03 14.72 14.71 15.44 13H17C19.21 13 21 11.21 21 9V7C21 5.9 20.1 5 19 5ZM7 11C5.9 11 5 10.1 5 9V7H7V11ZM19 9C19 10.1 18.1 11 17 11V7H19V9Z" />
    </svg>
);

const IconArrowForward = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 4L10.59 5.41L16.17 11H4V13H16.17L10.59 18.59L12 20L20 12L12 4Z" />
    </svg>
);

const IconLock = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM9 6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9V6ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17Z" />
    </svg>
);

export default function CompetitorTable({ competitors, auditData }) {
    if (!competitors || competitors.length === 0) return null;

    // You Data
    const youName = auditData?.businessName || "Your Business";
    const youScore = auditData?.totalScore || 72;
    const youReviews = auditData?.reviewCount || 0;
    const youPhotos = auditData?.photoCount || 0;

    // Rival Data (First Competitor)
    const rivalName = competitors[0]?.name || "Rival Business";
    const rivalScore = Math.min(100, (auditData?.totalScore || 70) + 16);
    const rivalReviews = competitors[0]?.reviewCount || 0;
    const rivalPhotos = competitors[0]?.photoCount || 0;
    const moreReviewsRival = rivalReviews > youReviews ? rivalReviews - youReviews : 0;

    // Leader Data (Second Competitor)
    const leaderName = competitors[1]?.name || "Market Leader";
    const leaderScore = Math.min(100, (auditData?.totalScore || 70) + 19);
    const leaderReviews = competitors[1]?.reviewCount || 0;
    const leaderPhotos = competitors[1]?.photoCount || 0;
    const moreReviewsLeader = leaderReviews > youReviews ? leaderReviews - youReviews : 0;
    const photoMultiplier = youPhotos > 0 ? Math.round(leaderPhotos / youPhotos) : 2;

    return (
        <div className="w-full max-w-[1200px] mx-auto py-12">
            {/* Header Section */}
            <div className="flex flex-col items-center text-center mb-12 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100 mb-6">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">LIVE ANALYSIS</span>
                </div>
                <h2 className="font-serif text-4xl md:text-5xl lg:text-[56px] font-semibold leading-tight text-slate-900 mb-4">
                    Neighborhood Standings
                </h2>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
                    You are currently ranking <span className="text-red-500 font-bold">3rd</span> in your immediate area.<br />
                    <span className="text-slate-400 text-base">See who is winning your customers right now.</span>
                </p>
            </div>

            {/* Battle Cards Container */}
            <div className="relative w-full grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start mb-16 px-4">
                {/* Connector Line (Desktop Only) */}
                <div className="hidden lg:block absolute top-[28%] left-[16%] right-[16%] h-[2px] border-t-2 border-dashed border-slate-300 -z-10"></div>

                {/* Card 1: YOU */}
                <div className="relative flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-md p-6 border-t-4 border-slate-200 transform transition hover:-translate-y-1 duration-300">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-slate-100 text-slate-600 px-4 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase border border-slate-200 shadow-sm">
                        YOU
                    </div>
                    <div className="flex flex-col items-center mb-6 mt-2">
                        <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                            {/* Score Ring SVG */}
                            <svg className="transform -rotate-90 w-24 h-24 whitespace-nowrap">
                                <circle className="text-slate-100" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                <circle className="text-amber-500" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * youScore) / 100} strokeWidth="8"></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-900">{youScore}</span>
                            </div>
                        </div>
                        <span className="text-amber-600 font-bold text-xs tracking-wide uppercase bg-amber-50 px-3 py-1 rounded-full mb-3">Needs Work</span>
                        <h3 className="text-xl font-bold text-slate-900 max-w-[200px] truncate" title={youName}>{youName}</h3>
                        <p className="text-sm text-slate-500 truncate" title={auditData?.address}>
                            {auditData?.address?.split(",")[0] || "Your Address"}
                        </p>
                    </div>
                    <div className="mt-auto space-y-3 bg-slate-50 rounded-xl p-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Total Reviews</span>
                            <span className="font-semibold text-slate-700">{youReviews}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Photos</span>
                            <span className="font-semibold text-slate-700">{youPhotos}</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: RIVAL */}
                <div className="relative flex flex-col h-full bg-white rounded-2xl shadow-sm hover:shadow-md p-6 border-t-4 border-emerald-500 transform transition hover:-translate-y-1 duration-300">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-emerald-600 px-4 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase border border-emerald-100 shadow-sm flex items-center gap-1">
                        <IconSwords className="w-4 h-4" /> RIVAL
                    </div>
                    <div className="flex flex-col items-center mb-6 mt-2">
                        <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                            <svg className="transform -rotate-90 w-24 h-24 whitespace-nowrap">
                                <circle className="text-slate-100" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                                <circle className="text-emerald-500" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * rivalScore) / 100} strokeWidth="8"></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-900">{rivalScore}</span>
                            </div>
                        </div>
                        <span className="text-emerald-600 font-bold text-xs tracking-wide uppercase bg-emerald-50 px-3 py-1 rounded-full mb-3">Top Rated</span>
                        <a
                            href={competitors[0]?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rivalName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xl font-bold text-slate-900 max-w-[200px] truncate hover:text-blue-600 transition-colors underline decoration-transparent hover:decoration-blue-600"
                            title={`View ${rivalName} on Google Maps`}
                        >
                            {rivalName}
                        </a>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                            <IconNearMe className="w-4 h-4" /> 0.2 mi away
                        </p>
                    </div>
                    <div className="mt-auto space-y-3 bg-slate-50 rounded-xl p-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Reviews</span>
                            <span className="font-bold text-emerald-600">{moreReviewsRival > 0 ? `+${moreReviewsRival} more` : `${rivalReviews}`}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Photos</span>
                            <span className="font-semibold text-slate-700">{rivalPhotos}</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: MARKET LEADER */}
                <div className="relative flex flex-col h-full bg-white rounded-2xl shadow-lg p-6 border-t-4 border-blue-600 ring-2 ring-blue-600/10 transform lg:scale-105 z-10 transition hover:-translate-y-1 duration-300 hover:shadow-xl">
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest uppercase shadow-md flex items-center gap-1 whitespace-nowrap">
                        <IconTrophy className="w-4 h-4" /> MARKET LEADER
                    </div>
                    <div className="flex flex-col items-center mb-6 mt-2">
                        <div className="relative w-28 h-28 mb-4 flex items-center justify-center">
                            <svg className="transform -rotate-90 w-28 h-28 whitespace-nowrap">
                                <circle className="text-slate-100" cx="56" cy="56" fill="transparent" r="46" stroke="currentColor" strokeWidth="8"></circle>
                                <circle className="text-blue-600" cx="56" cy="56" fill="transparent" r="46" stroke="currentColor" strokeDasharray="289" strokeDashoffset={289 - (289 * leaderScore) / 100} strokeWidth="8"></circle>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-bold text-slate-900">{leaderScore}</span>
                            </div>
                        </div>
                        <span className="text-blue-600 font-bold text-xs tracking-wide uppercase bg-blue-50 px-3 py-1 rounded-full mb-3">Elite</span>
                        <a
                            href={competitors[1]?.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(leaderName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-2xl font-bold text-slate-900 max-w-[200px] truncate hover:text-blue-600 transition-colors underline decoration-transparent hover:decoration-blue-600"
                            title={`View ${leaderName} on Google Maps`}
                        >
                            {leaderName}
                        </a>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                            <IconNearMe className="w-4 h-4" /> 0.4 mi away
                        </p>
                    </div>
                    <div className="mt-auto space-y-3 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Reviews</span>
                            <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase">{moreReviewsLeader > 0 ? `+${moreReviewsLeader} more!` : leaderReviews}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-600 font-medium">Photos</span>
                            <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded text-[10px] uppercase">{photoMultiplier > 1 ? `${photoMultiplier}x more` : leaderPhotos}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
