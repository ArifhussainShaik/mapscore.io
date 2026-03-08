import { auth } from "@/auth";
import { getAvailableCredits } from "@/libs/credits";
import Link from "next/link";

export const metadata = {
    title: "Pricing | LocalScore",
    description: "Unlock full local SEO audits with our simple pay-as-you-go credit packs.",
};

export default async function PricingPage() {
    const session = await auth();
    let currentBalance = 0;

    if (session?.user?.id) {
        currentBalance = await getAvailableCredits(session.user.id);
    }

    const DODO_STARTER_URL = process.env.DODO_STARTER_CHECKOUT_URL || "#";
    const DODO_GROWTH_URL = process.env.DODO_GROWTH_CHECKOUT_URL || "#";
    const DODO_AGENCY_URL = process.env.DODO_AGENCY_CHECKOUT_URL || "#";

    // Reusable UI Features component
    const PackFeatures = () => (
        <ul className="space-y-4 mb-8 text-left text-sm text-slate-700">
            {[
                "100-Point Audit Report",
                "Competitor Comparison Table",
                "Revenue Impact Calculator",
                "Advanced SEO Diagnostics",
                "Priority Action Plan",
                "Export PDF Presentation",
                "Credits valid for 1 full year",
            ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{feature}</span>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="bg-[#F4F2EB] min-h-screen py-20 px-6 font-sans">
            <div className="max-w-7xl mx-auto text-center">
                {/* Header */}
                <h1 className="text-4xl md:text-5xl font-black font-serif text-slate-900 mb-4 tracking-tight">
                    Simple, pay-as-you-go pricing.
                </h1>
                <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
                    Buy audit credits now, use them anytime. 1 Credit = 1 Full Audit Unlock.
                </p>

                {/* Logged in state */}
                {session && (
                    <div className="mb-12 inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full border border-slate-200 shadow-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-medium text-slate-700">Your current balance:</span>
                        <span className="font-bold text-lg text-slate-900">{currentBalance} Credits</span>
                    </div>
                )}

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">

                    {/* Starter Pack */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative flex flex-col h-full text-left">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold font-serif tracking-tight text-slate-900">Starter Pack</h3>
                            <p className="text-slate-500 text-sm mt-1">Perfect for solo freelancers.</p>
                        </div>
                        <div className="mb-4">
                            <span className="text-5xl font-black text-slate-900 tracking-tight">$9</span>
                            <span className="text-slate-500 font-medium"> / pack</span>
                        </div>
                        <div className="mb-8">
                            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-blue-100 mb-2">
                                3 Credits
                            </span>
                            <p className="text-sm font-semibold text-slate-500">Only $3.00 per audit</p>
                        </div>

                        <div className="flex-grow">
                            <PackFeatures />
                        </div>

                        <a
                            href={session ? `${DODO_STARTER_URL}?sub=${session.user.email}` : "/login"}
                            className="btn btn-block bg-slate-900 hover:bg-slate-800 text-white border-none rounded-xl font-bold mt-auto"
                        >
                            {session ? "Buy 3 Credits" : "Login to Buy"}
                        </a>
                    </div>

                    {/* Growth Pack (Highlighted) */}
                    <div className="bg-white rounded-3xl p-8 border-2 border-slate-900 shadow-2xl relative flex flex-col h-[105%] z-10 text-left transform md:-translate-y-4">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                            Most Popular
                        </div>
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold font-serif tracking-tight text-slate-900">Growth Pack</h3>
                            <p className="text-slate-500 text-sm mt-1">Best value for growing agencies.</p>
                        </div>
                        <div className="mb-4">
                            <span className="text-5xl font-black text-slate-900 tracking-tight">$19</span>
                            <span className="text-slate-500 font-medium"> / pack</span>
                        </div>
                        <div className="mb-8">
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-emerald-100 mb-2">
                                10 Credits
                            </span>
                            <p className="text-sm font-semibold text-emerald-600">Only $1.90 per audit</p>
                        </div>

                        <div className="flex-grow">
                            <PackFeatures />
                        </div>

                        <a
                            href={session ? `${DODO_GROWTH_URL}?sub=${session.user.email}` : "/login"}
                            className="btn btn-block bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl font-bold text-lg mt-auto shadow-lg shadow-emerald-500/30"
                        >
                            {session ? "Buy 10 Credits" : "Login to Buy"}
                        </a>
                    </div>

                    {/* Agency Pack */}
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative flex flex-col h-full text-left">
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold font-serif tracking-tight text-slate-900">Agency Pack</h3>
                            <p className="text-slate-500 text-sm mt-1">For high-volume prospecting.</p>
                        </div>
                        <div className="mb-4">
                            <span className="text-5xl font-black text-slate-900 tracking-tight">$49</span>
                            <span className="text-slate-500 font-medium"> / pack</span>
                        </div>
                        <div className="mb-8">
                            <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 font-bold text-xs uppercase tracking-wider rounded-lg border border-purple-100 mb-2">
                                30 Credits
                            </span>
                            <p className="text-sm font-semibold text-slate-500">Only $1.63 per audit</p>
                        </div>

                        <div className="flex-grow">
                            <PackFeatures />
                        </div>

                        <a
                            href={session ? `${DODO_AGENCY_URL}?sub=${session.user.email}` : "/login"}
                            className="btn btn-block bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-200 rounded-xl font-bold mt-auto"
                        >
                            {session ? "Buy 30 Credits" : "Login to Buy"}
                        </a>
                    </div>

                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mt-24 text-left">
                    <h3 className="text-3xl font-bold font-serif text-slate-900 mb-8 tracking-tight text-center">Frequently Asked Questions</h3>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-2">Do credits expire?</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">Yes. All purchased credits are valid for exactly one year (365 days) from the date of purchase. We use a "First In, First Out" (FIFO) system, meaning the oldest credits in your account are automatically used first.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-2">What does "1 Credit" actually unlock?</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">A single credit permanently unlocks a full, 100-point LocalScore audit report. This grants you unlimited access to view that specific business's competitor comparison table, revenue impact calculator, PDF export feature, and priority action plan. Free preview reports cost 0 credits.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-100">
                            <h4 className="font-bold text-slate-900 mb-2">Is this a monthly subscription?</h4>
                            <p className="text-slate-600 text-sm leading-relaxed">No. We operate purely on a Pay-As-You-Go model. You will only be billed once for the pack you select. There are no recurring monthly charges or hidden fees.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
