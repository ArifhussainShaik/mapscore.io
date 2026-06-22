import SearchBar from "@/components/SearchBar";

import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import Pricing from "@/components/Pricing";
import ScrollReveal from "@/components/ScrollReveal";

export default function LandingPage() {
  return (
    <>
      {/* Navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold font-sans">ls</span>
            </div>
            <span className="text-xl font-bold text-zinc-100 font-serif tracking-tight">
              LocalScore
            </span>
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded">
              Beta
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Pricing</a>
            <ButtonSignin text="Sign in" extraStyle="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors bg-transparent border-0 p-0 min-h-0 h-auto" />
            <Link href="#search" className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 border-0">
              Audit My Profile
            </Link>
          </div>
        </nav>
      </header>

      <main className="bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30 grain">
        {/* ===== HERO ===== */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 overflow-hidden">
          {/* Subtle radial glow behind hero */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gradient-radial from-indigo-500/10 via-transparent to-transparent rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-4xl mx-auto w-full">

            {/* Pill Badge — animated entrance */}
            <div className="opacity-0 animate-[slide-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards]">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 shadow-sm text-zinc-400 text-sm font-medium mb-8">
                <div className="w-5 h-5 rounded-full bg-[#00c565] text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Free Google Business Profile audit — no signup required</span>
              </div>
            </div>

            {/* Heading — staggered entrance */}
            <h1 className="text-5xl md:text-7xl font-bold font-serif text-zinc-100 leading-[1.1] tracking-tight mb-6 opacity-0 animate-[slide-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.25s_forwards]">
              Your Google profile is quietly<br />losing you customers.
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12 opacity-0 animate-[slide-up_0.8s_cubic-bezier(0.16,1,0.3,1)_0.4s_forwards]">
              See exactly which ones — and why. We scan 50+ ranking factors and hand<br className="hidden md:block" />
              you a prioritized fix list. Free, no signup.
            </p>

            {/* Search Box Area — delayed entrance */}
            <div id="search" className="max-w-4xl mx-auto w-full flex flex-col items-center opacity-0 animate-[scale-in_0.6s_cubic-bezier(0.16,1,0.3,1)_0.6s_forwards]">
              <div className="w-full mb-6 relative">
                <SearchBar variant="hero" />
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 font-medium">
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

        {/* ===== WHAT WE CHECK ===== */}
        <section className="py-16 px-6 max-w-7xl mx-auto w-full">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-serif text-zinc-100">What we analyze</h2>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-500 uppercase">
                60+ checks
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "📋", name: "Profile Completeness", loc: "Categories, hours, description, attributes", rating: "18 checks" },
              { icon: "⭐", name: "Reviews & Reputation", loc: "Count, rating, recency, response rate", rating: "12 checks" },
              { icon: "📸", name: "Visual Content", loc: "Photo count, variety, logo, cover photo", rating: "10 checks" },
              { icon: "🏆", name: "Competitive Position", loc: "Review gap, rating gap, photo gap vs rivals", rating: "5 checks" }
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i < 4 ? i + 1 : 4}>
                <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800/60 hover:border-zinc-700/60 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start mb-12">
                    <div className="text-3xl">{item.icon}</div>
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100">{item.name}</h3>
                    <p className="text-sm text-zinc-500 mb-3">{item.loc}</p>
                    <div className="flex items-center gap-1 text-indigo-400 text-sm font-semibold">
                      {item.rating}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section id="how-it-works" className="py-32 px-6 border-t border-zinc-800/50">
          <div className="max-w-5xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-4">
                Your audit in 3 simple steps
              </h2>
              <p className="text-zinc-400 mb-20">No technical skills needed. A deep scan of 50+ factors, not a quick guess.</p>
            </ScrollReveal>

            <div className="relative">
              {/* Connecting Line */}
              <div className="absolute top-8 left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-zinc-700 -z-10 hidden md:block"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {[
                  {
                    icon: (
                      <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    ),
                    bg: "bg-indigo-500/10 border border-indigo-500/20",
                    title: "Search your business",
                    desc: "Type your business name or paste your Google Maps link."
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    ),
                    bg: "bg-amber-500/10 border border-amber-500/20",
                    title: "We analyze 50+ factors",
                    desc: "Reviews, photos, categories, hours, posts, and competitor data."
                  },
                  {
                    icon: (
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ),
                    bg: "bg-emerald-500/10 border border-emerald-500/20",
                    title: "Get your action plan",
                    desc: "Prioritized fixes written in plain English, not SEO jargon."
                  }
                ].map((step, i) => (
                  <ScrollReveal key={i} delay={i + 1}>
                    <div className="flex flex-col items-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ring-8 ring-zinc-900 ${step.bg}`}>
                        {step.icon}
                      </div>
                      <h3 className="text-xl font-bold font-serif text-zinc-100 mb-3">{step.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed px-4">{step.desc}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== SAMPLE REPORTS ===== */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-4">
                  See what your audit looks like
                </h2>
                <p className="text-zinc-400">Here&apos;s what your report will include.</p>
              </div>
            </ScrollReveal>

            {/* Asymmetric bento grid — breaking the 3-col monotony */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
              {/* Large featured card */}
              <ScrollReveal className="md:col-span-7">
                <div className="block bg-zinc-900/60 rounded-3xl p-8 md:p-10 border border-zinc-800/60 hover:border-zinc-700/60 hover:-translate-y-1 transition-all duration-300 group h-full relative overflow-hidden">
                  {/* Decorative accent */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none"></div>

                  <div className="relative">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center text-2xl">
                          🍝
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-zinc-100">Mario&apos;s Italian Kitchen</h3>
                          <p className="text-sm text-zinc-500">Good start, room to grow</p>
                        </div>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-indigo-500 flex items-center justify-center text-2xl font-bold text-indigo-400 font-sans">
                        B+
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-zinc-800/60 rounded-xl p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Photos</p>
                        <p className="text-lg font-bold text-zinc-100">12 <span className="text-sm font-normal text-amber-400">/ 30+ needed</span></p>
                      </div>
                      <div className="bg-zinc-800/60 rounded-xl p-4">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Reviews</p>
                        <p className="text-lg font-bold text-zinc-100">47 <span className="text-sm font-normal text-red-400">0% replied</span></p>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      <li className="flex items-center gap-2 text-sm text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Hours complete</li>
                      <li className="flex items-center gap-2 text-sm text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> 12 photos (need 30+)</li>
                      <li className="flex items-center gap-2 text-sm text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> No review responses</li>
                    </ul>

                    <span className="text-indigo-400 font-semibold text-sm inline-flex items-center gap-1">
                      Sample report preview
                    </span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Stacked right column */}
              <div className="md:col-span-5 flex flex-col gap-6">
                <ScrollReveal delay={1}>
                  <div className="block bg-zinc-900/60 rounded-3xl p-8 border border-zinc-800/60 hover:border-zinc-700/60 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center text-xl">
                          🧰
                        </div>
                        <div className="w-14 h-14 rounded-full border-4 border-red-500 flex items-center justify-center text-xl font-bold text-red-400 font-sans">
                          D
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100 mb-1">Smith &amp; Sons Plumbing</h3>
                      <p className="text-sm text-zinc-500 mb-4">Needs urgent attention</p>

                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2 text-sm text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> No website linked</li>
                        <li className="flex items-center gap-2 text-sm text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> 0 recent posts</li>
                      </ul>

                      <span className="text-indigo-400 font-semibold text-sm inline-flex items-center gap-1">
                        Sample report preview
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={2}>
                  <div className="block bg-zinc-900/60 rounded-3xl p-8 border border-zinc-800/60 hover:border-zinc-700/60 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center text-xl">
                          🦷
                        </div>
                        <div className="w-14 h-14 rounded-full border-4 border-emerald-500 flex items-center justify-center text-xl font-bold text-emerald-400 font-sans">
                          A
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100 mb-1">Bright Smile Dental</h3>
                      <p className="text-sm text-zinc-500 mb-4">Excellent performance</p>

                      <ul className="space-y-2 mb-4">
                        <li className="flex items-center gap-2 text-sm text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> 100% profile complete</li>
                        <li className="flex items-center gap-2 text-sm text-zinc-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> High engagement</li>
                      </ul>

                      <span className="text-indigo-400 font-semibold text-sm inline-flex items-center gap-1">
                        Sample report preview
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </section>

        {/* ===== WHY LOCAL BUSINESSES USE LOCALSCORE ===== */}
        <section className="py-24 px-6 border-t border-zinc-800/50">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-16 text-center md:text-left">
                Common issues we<br className="hidden md:block" /> catch for businesses
              </h2>
            </ScrollReveal>

            {/* Offset grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                {
                  icon: "⏰",
                  title: "Incorrect business hours",
                  desc: "Wrong hours on your Google profile means lost customers who show up when you're closed — or skip you entirely.",
                  offset: "md:mt-0",
                },
                {
                  icon: "📸",
                  title: "Not enough photos",
                  desc: "Profiles with 20+ photos get more calls and direction requests. We count yours and show you the exact gap to close.",
                  offset: "md:mt-12",
                },
                {
                  icon: "💬",
                  title: "Unanswered reviews",
                  desc: "Responding to reviews signals active management to Google. We check your response rate and flag missed replies.",
                  offset: "md:-mt-4",
                },
              ].map((t, i) => (
                <ScrollReveal key={i} delay={i + 1} className={t.offset}>
                  <div className="bg-zinc-900/60 backdrop-blur-sm rounded-3xl p-8 border border-zinc-800/60 hover:border-zinc-700/60 flex flex-col justify-between transition-all duration-300 h-full">
                    <div>
                      <div className="text-4xl mb-6">{t.icon}</div>
                      <h3 className="text-xl font-bold text-zinc-100 mb-3 font-serif">{t.title}</h3>
                      <p className="text-zinc-400 leading-relaxed">
                        {t.desc}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FOUNDER + TESTIMONIALS (rule 15 founder, rule 29 proof) ===== */}
        <section className="py-24 px-6 border-t border-zinc-800/50">
          <div className="max-w-6xl mx-auto">

            {/* Founder note + video slot */}
            <ScrollReveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20">
                <div className="relative aspect-video rounded-3xl bg-zinc-900 border border-zinc-800/60 flex items-center justify-center overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                  <span className="absolute bottom-4 left-4 text-xs font-medium text-zinc-400">Founder walkthrough — coming soon</span>
                </div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold font-serif text-zinc-100 mb-4">
                    Why I built LocalScore
                  </h2>
                  <p className="text-zinc-400 leading-relaxed mb-4">
                    I watched good local businesses lose customers to worse competitors —
                    not because their service was bad, but because their Google profile was.
                    Missing photos. Wrong hours. Reviews left hanging.
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    So I built the tool I wished they had: one honest score, and the exact
                    list of fixes — in plain English, no agency retainer.
                  </p>
                  <p className="mt-6 font-serif font-bold text-zinc-100">— Arif, founder</p>
                </div>
              </div>
            </ScrollReveal>

            {/* Testimonial placeholders */}
            <ScrollReveal>
              <h2 className="text-2xl font-bold font-serif text-zinc-100 mb-10 text-center">
                What owners say after their audit
              </h2>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                { quote: "Add a real customer quote here — what changed after they fixed their profile.", name: "Owner name", biz: "Business · City" },
                { quote: "A second testimonial. Specific numbers (more calls, more reviews) hit hardest.", name: "Owner name", biz: "Business · City" },
                { quote: "A third. Beta tester or friend is fine to start — collect proof before traffic.", name: "Owner name", biz: "Business · City" },
              ].map((t, i) => (
                <ScrollReveal key={i} delay={i + 1}>
                  <div className="bg-zinc-900/60 rounded-3xl p-8 border border-zinc-800/60 h-full flex flex-col">
                    <div className="flex gap-1 mb-4 text-amber-400">
                      {[...Array(5)].map((_, s) => (
                        <svg key={s} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.4 4.31a1 1 0 00.95.69h4.53c.97 0 1.37 1.24.59 1.81l-3.67 2.67a1 1 0 00-.36 1.12l1.4 4.31c.3.92-.75 1.69-1.54 1.12l-3.66-2.67a1 1 0 00-1.18 0l-3.66 2.67c-.79.57-1.84-.2-1.54-1.12l1.4-4.31a1 1 0 00-.36-1.12L2.07 9.75c-.78-.57-.38-1.81.59-1.81h4.53a1 1 0 00.95-.69l1.4-4.31z" /></svg>
                      ))}
                    </div>
                    <p className="text-zinc-400 leading-relaxed flex-grow">&ldquo;{t.quote}&rdquo;</p>
                    <div className="mt-6">
                      <p className="font-bold text-zinc-100 text-sm">{t.name}</p>
                      <p className="text-zinc-500 text-sm">{t.biz}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <Pricing />

        {/* ===== BOTTOM CTA ===== */}
        <ScrollReveal>
          <section className="py-24 px-6 bg-zinc-900/40 border-t border-zinc-800/50">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold font-serif text-zinc-100 mb-10">
                Ready to see how you stack up?
              </h2>
              <div className="max-w-xl mx-auto mb-6">
                <SearchBar variant="hero" />
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <div className="w-4 h-4 rounded-full bg-[#00c565] text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                Free audit — no signup required — full 50+ factor scan
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* ===== FOOTER ===== */}
        <footer className="bg-zinc-900 border-t border-zinc-800/60 text-zinc-400 py-16 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">ls</span>
                </div>
                <span className="text-lg font-bold text-zinc-100 font-serif">LocalScore</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                Every day your profile sits unoptimized, a competitor takes the call.
                LocalScore shows you the fixes — before they do.
              </p>
            </div>

            <div>
              <h4 className="text-zinc-100 font-bold text-xs uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#how-it-works" className="hover:text-zinc-100 transition-colors">How it Works</a></li>
                <li><a href="#search" className="hover:text-zinc-100 transition-colors">Run an Audit</a></li>
                <li><a href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-zinc-100 font-bold text-xs uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy-policy" className="hover:text-zinc-100 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/tos" className="hover:text-zinc-100 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-zinc-100 font-bold text-xs uppercase tracking-widest mb-4">Account</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/dashboard" className="hover:text-zinc-100 transition-colors">Dashboard</Link></li>
                <li><ButtonSignin text="Sign in" extraStyle="text-sm text-zinc-400 hover:text-zinc-100 transition-colors bg-transparent border-0 p-0 min-h-0 h-auto" /></li>
              </ul>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-600">
            <p>&copy; {new Date().getFullYear()} LocalScore. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Know an owner flying blind on Google? Send them their score.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
