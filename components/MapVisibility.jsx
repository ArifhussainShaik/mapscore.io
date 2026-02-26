"use client";

// Creating a dummy visual MapVisibility component to match the LocalScore screenshot exactly.
export default function MapVisibility({ audit }) {
    // In a real app we'd determine rank from audit data. Let's spoof finding "Rank #4".
    const rank = Math.floor(Math.random() * 5) + 1; // Fake rank between 1-5 for visual accuracy

    return (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full relative group cursor-pointer group">

            {/* Fake isometric map background (SVG structure meant to emulate the grid mapping software visual) */}
            <div className="w-full h-40 bg-[#F4F2EB]/50 relative overflow-hidden flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                {/* Simple rotated grid lines */}
                <div className="absolute inset-0" style={{ transform: 'rotateX(60deg) rotateZ(-45deg)', backgroundSize: '40px 40px', backgroundImage: 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)' }}></div>

                {/* Fake pins scattered */}
                {[
                    { top: '30%', left: '20%' },
                    { top: '40%', left: '45%' },
                    { top: '60%', left: '30%' },
                    { top: '25%', left: '70%' },
                    { top: '65%', left: '80%' }
                ].map((pos, i) => (
                    <div key={i} className="absolute w-3 h-3 bg-slate-400 rounded-full" style={{ ...pos, transform: 'translate(-50%, -50%)', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div className="absolute w-1 h-3 bg-slate-400 -bottom-2 left-1/2 -translate-x-1/2"></div>
                    </div>
                ))}

                {/* Main Highlight Pin */}
                <div className="relative z-10 w-6 h-6 bg-slate-800 rounded-full border-2 border-white flex items-center justify-center shadow-lg -translate-y-4">
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-slate-800 border-r-[6px] border-r-transparent"></div>
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>

                    {/* Rank Tooltip ALWAYS showing */}
                    <div className="absolute -top-8 bg-slate-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap shadow-md flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Rank #{rank}
                    </div>
                </div>

                {/* Overlay gradient to fade out edges nicely */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            </div>

            <div className="p-6 relative z-10 bg-white">
                <h3 className="text-xl font-bold font-serif text-slate-900 mb-2">Map Visibility</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                    You are visible in the top 3 for &apos;{audit.primaryCategory || "Coffee near me"}&apos; across 80% of local searches.
                </p>
            </div>
        </div>
    );
}
