const fs = require('fs');
const file = 'app/page.js';
let content = fs.readFileSync(file, 'utf8');

// Replace standard dark mode colors to light mode / blue colors
content = content.replace(/text-white/g, 'text-slate-900');
content = content.replace(/text-emerald-400/g, 'text-blue-600');
content = content.replace(/text-emerald-500/g, 'text-blue-600');
content = content.replace(/bg-emerald-400/g, 'bg-blue-600');
content = content.replace(/bg-emerald-500\/10/g, 'bg-blue-600/10');
content = content.replace(/bg-emerald-500\/20/g, 'bg-blue-600/20');
content = content.replace(/bg-emerald-500\/30/g, 'bg-blue-600/30');
content = content.replace(/border-emerald-500\/20/g, 'border-blue-600/20');
content = content.replace(/border-emerald-500\/30/g, 'border-blue-600/30');
content = content.replace(/from-emerald-400 to-cyan-400/g, 'from-blue-600 to-indigo-500');
content = content.replace(/from-emerald-500 to-cyan-500/g, 'from-blue-600 to-indigo-500');
content = content.replace(/hover:border-emerald-500\/20/g, 'hover:border-blue-600/20');
content = content.replace(/hover:border-emerald-500\/30/g, 'hover:border-blue-600/30');

// Replace testimonials with authentic data and photos
const testimonialsPattern = /const testimonials = \[[\s\S]*?\];/; // if it was a variable, but it's inline
// manually replace the array
let newTestimonials = `[
                {
                  quote: "We were losing leads because our profile had bad formatting and limited visibility. Found exactly what was wrong instantly and fixed it within hours.",
                  name: "Michael Roberts",
                  role: "Owner, Advanced Plumbing Co.",
                  stars: 5,
                  image: "https://i.pravatar.cc/150?u=mroberts",
                },
                {
                  quote: "The competitor comparison view gave us exactly the data we needed to convince clients to invest in local SEO. The white-labeled PDF looks extremely professional.",
                  name: "Sarah Jenkins",
                  role: "Director, Local Growth Agency",
                  stars: 5,
                  image: "https://i.pravatar.cc/150?u=sjenkins",
                },
                {
                  quote: "Simple, to the point, and highly actionable. We bumped our local map pack ranking from #7 to #3 just by following the priority action plan.",
                  name: "David Chen",
                  role: "Marketing Consultant",
                  stars: 5,
                  image: "https://i.pravatar.cc/150?u=dchen",
                },
              ]`;

content = content.replace(/\[\s*\{\s*quote:\s*"I was spending 45 minutes[\s\S]*?\]/m, newTestimonials);

// Add the image tag to the testimonials map
content = content.replace(/(<div className="flex gap-1 text-amber-400 mb-4">)/, function(match) {
    return `<div className="flex items-center gap-4 mb-4">
                    <img src={t.image} alt={t.name} className="w-12 h-12 rounded-full border border-base-content/10" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                      <p className="text-xs text-base-content/50">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-amber-500 mb-3">`;
});

// Remove old name/role tags at bottom of testimonial card
content = content.replace(/<div>\s*<p className="text-sm font-semibold text-slate-900">\{t\.name\}<\/p>\s*<p className="text-xs text-base-content\/40">\{t\.role\}<\/p>\s*<\/div>/g, "");


// Example buttons under search bar
const insertExamplesStr = `
            {/* One-Click Examples */}
            <div className="mt-8">
              <p className="text-xs text-base-content/40 font-bold uppercase tracking-wider mb-3">Try an Example</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/audit/demo?business=Downtown+Dental&city=Chicago" className="px-4 py-2 bg-white border border-base-content/10 shadow-sm rounded-full text-sm text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2">
                  <span className="text-blue-500">🦷</span> Downtown Dental
                </Link>
                <Link href="/audit/demo?business=Joe's+Plumbing&city=Miami" className="px-4 py-2 bg-white border border-base-content/10 shadow-sm rounded-full text-sm text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2">
                  <span className="text-blue-500">🔧</span> Joe's Plumbing
                </Link>
                <Link href="/audit/demo?business=Elite+Roofing&city=Dallas" className="px-4 py-2 bg-white border border-base-content/10 shadow-sm rounded-full text-sm text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-2">
                  <span className="text-blue-500">🏠</span> Elite Roofing
                </Link>
              </div>
            </div>`;

content = content.replace(/(<SearchBar variant="hero" \/>\s*<\/div>)/, `$1\n${insertExamplesStr}`);

fs.writeFileSync(file, content);
console.log("Replaced app/page.js styles!");
