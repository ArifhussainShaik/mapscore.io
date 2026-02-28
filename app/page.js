import SearchBar from "@/components/SearchBar";
import FAQ from "@/components/FAQ";
import config from "@/config";
import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import Pricing from "@/components/Pricing";

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold font-sans">ls</span>
            </div>
            <span className="text-xl font-bold text-slate-900 font-serif tracking-tight">
              LocalScore
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">
              Beta
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</a>
            <ButtonSignin text="Sign in" extraStyle="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors bg-transparent border-0 p-0 min-h-0 h-auto" />
            <Link href="#search" className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 border-0">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="bg-[#F4F2EB] text-slate-900 font-sans selection:bg-blue-200">
        {/* ===== HERO ===== */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 overflow-hidden">
          <div className="relative z-10 max-w-4xl mx-auto w-full">

            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-slate-700 text-sm font-medium mb-8">
              <div className="flex -space-x-2">
                <img src="https://i.pravatar.cc/100?img=33" className="w-6 h-6 rounded-full border-2 border-white" alt="User" />
                <img src="https://i.pravatar.cc/100?img=11" className="w-6 h-6 rounded-full border-2 border-white" alt="User" />
                <img src="https://i.pravatar.cc/100?img=47" className="w-6 h-6 rounded-full border-2 border-white" alt="User" />
              </div>
              <span className="ml-1">Join <span className="font-bold text-slate-900">2,401</span> audited businesses today</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold font-serif text-slate-900 leading-[1.1] tracking-tight mb-6">
              Find out how your Google<br />Business Profile really<br />performs
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-12">
              Get a free, instant audit with actionable tips to attract more local<br className="hidden md:block" />
              customers. No signup required.
            </p>

            {/* Search Box Area */}
            <div id="search" className="max-w-4xl mx-auto w-full flex flex-col items-center">
              <div className="w-full mb-6 relative">
                <SearchBar variant="hero" />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-slate-600 font-medium">
                <div className="w-5 h-5 rounded-full bg-[#00c565] text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Analyzes 50+ ranking factors
              </div>
            </div>
          </div>
        </section>

        {/* ===== RECENT AUDITS ===== */}
        <section className="py-16 px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold font-serif text-slate-900">Recent Audits</h2>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-500 uppercase">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Updates
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🍕", name: "Luigi's Pizzeria", loc: "Brooklyn, NY", rating: "4.8" },
              { icon: "☕️", name: "Morning Brew", loc: "Austin, TX", rating: "5.0" },
              { icon: "🪴", name: "Green Leaf Nursery", loc: "Portland, OR", rating: "4.2" },
              { icon: "✂️", name: "Sharp Cuts Barber", loc: "Chicago, IL", rating: "4.7" }
            ].map((audit, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-12">
                  <div className="text-3xl">{audit.icon}</div>
                  <div className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{audit.name}</h3>
                  <p className="text-sm text-slate-500 mb-3">{audit.loc}</p>
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {"★★★★★"} <span className="text-slate-900 font-semibold ml-1">{audit.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="py-32 px-6 border-t border-slate-200/50">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-4">
              Your audit in 3 simple steps
            </h2>
            <p className="text-slate-600 mb-20">No technical skills needed. Takes 30 seconds.</p>

            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-8 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-slate-300 -z-10 hidden md:block"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    ),
                    bg: "bg-blue-100",
                    title: "Search your business",
                    desc: "Type your business name or paste your Google Maps link."
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    bg: "bg-amber-100",
                    title: "We analyze 50+ factors",
                    desc: "Reviews, photos, categories, hours, posts, and competitor data."
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ),
                    bg: "bg-green-100",
                    title: "Get your action plan",
                    desc: "Prioritized fixes written in plain English, not SEO jargon."
                  }
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-white shadow-sm ring-8 ring-[#F4F2EB] ${step.bg}`}>
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 mb-3">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed px-4">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SAMPLE REPORTS ===== */}
        <section className="py-24 px-6 bg-[#F4F2EB]">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-4">
              See what your audit looks like
            </h2>
            <p className="text-slate-600 mb-16">Click any example to explore a full report.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Example 1 */}
              <Link href="/audit/demo?business=Mario's" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all group block">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
                    🍝
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-blue-500 flex items-center justify-center text-xl font-bold text-blue-600 font-sans">
                    B+
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Mario&apos;s Italian Kitchen</h3>
                <p className="text-sm text-slate-500 mb-6">Good start, room to grow</p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Hours complete</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 12 photos (need 30+)</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> No review responses</li>
                </ul>

                <span className="text-blue-600 font-semibold text-sm group-hover:underline">View full report &rarr;</span>
              </Link>

              {/* Example 2 */}
              <Link href="/audit/demo?business=Smith" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all group block">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl">
                    🧰
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-red-500 flex items-center justify-center text-xl font-bold text-red-600 font-sans">
                    D
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Smith & Sons Plumbing</h3>
                <p className="text-sm text-slate-500 mb-6">Needs urgent attention</p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> No website linked</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 0 recent posts</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Rating under 4.0</li>
                </ul>

                <span className="text-blue-600 font-semibold text-sm group-hover:underline">View full report &rarr;</span>
              </Link>

              {/* Example 3 */}
              <Link href="/audit/demo?business=Bright" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all group block">
                <div className="flex justify-between items-start mb-12">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl">
                    🦷
                  </div>
                  <div className="w-14 h-14 rounded-full border-4 border-green-500 flex items-center justify-center text-xl font-bold text-green-600 font-sans">
                    A
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">Bright Smile Dental</h3>
                <p className="text-sm text-slate-500 mb-6">Excellent performance</p>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 100% profile complete</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> High engagement</li>
                  <li className="flex items-center gap-2 text-sm text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Review velocity optimal</li>
                </ul>

                <span className="text-blue-600 font-semibold text-sm group-hover:underline">View full report &rarr;</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== TESTIMONIALS ===== */}
        <section className="py-24 px-6 border-t border-slate-200/50">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-16">
              Local business owners love their results
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                {
                  quote: "I had no idea my hours were wrong on Google. The audit caught it in seconds. Got 3 more calls that week.",
                  name: "Lisa Chen",
                  role: "Golden Dragon, Portland OR",
                  image: "https://i.pravatar.cc/150?u=lisachen",
                },
                {
                  quote: "My competitor was outranking me because they had more photos. This showed me exactly what to fix.",
                  name: "Mike Thompson",
                  role: "Thompson's HVAC, Austin TX",
                  image: "https://i.pravatar.cc/150?u=miket",
                },
                {
                  quote: "I use this for all my clients. The reports look professional and save me hours every month.",
                  name: "Sarah Williams",
                  role: "Marketing Consultant, Chicago IL",
                  image: "https://i.pravatar.cc/150?u=sarahw",
                },
              ].map((t, i) => (
                <div key={i} className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 text-amber-400 mb-6">
                      ★★★★★
                    </div>
                    <p className="text-slate-600 leading-relaxed italic mb-8">
                      &quot;{t.quote}&quot;
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full border border-slate-100" />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Pricing />

        {/* ===== BOTTOM CTA ===== */}
        <section className="py-24 px-6 bg-[#E8E6DF] border-t border-slate-200/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold font-serif text-slate-900 mb-10">
              Ready to see how you stack up?
            </h2>
            <div className="bg-white p-2 rounded-full shadow-lg border border-slate-100 flex items-center mb-6 max-w-xl mx-auto">
              {/* Dummy input for visual since SearchBar is more complex and handles its own stuff, we fake it for the bottom CTA visual fidelity based on the screenshot */}
              <div className="w-full pl-4 flex items-center bg-white rounded-full">
                <input type="text" placeholder="Enter your business name..." className="flex-grow bg-transparent border-0 focus:ring-0 text-sm py-2" readOnly />
                <button className="bg-blue-600 text-white rounded-full px-6 py-2.5 text-sm font-bold ml-2">Get Free Audit</button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
              <div className="flex -space-x-1">
                <div className="w-4 h-4 rounded-full bg-blue-400"></div>
                <div className="w-4 h-4 rounded-full bg-green-400"></div>
                <div className="w-4 h-4 rounded-full bg-amber-400"></div>
              </div>
              Join 2,401 local businesses improving their Google presence
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="bg-[#2C2B29] text-slate-300 py-16 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">ls</span>
                </div>
                <span className="text-lg font-bold text-white font-serif">LocalScore</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                Helping local businesses dominate their neighborhood on Google Maps.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sample Reports</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">SEO Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Google Profile Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Review Templates</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-8 border-t border-slate-700 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} LocalScore. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Made with care for local businesses <span className="text-red-500">❤️</span></p>
          </div>
        </footer>
      </main>
    </>
  );
}
