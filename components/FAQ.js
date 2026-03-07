"use client";

import { useRef, useState } from "react";
import Script from "next/script";

// 8 SEO-optimized GBP audit questions
const faqList = [
  {
    question: "What is a Google Business Profile audit?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          A Google Business Profile (GBP) audit is a comprehensive analysis of your
          business listing on Google Maps and Search. It evaluates key ranking factors
          like profile completeness, review quality, photo optimization, posting activity,
          and website performance to give you an actionable score and improvement plan.
        </p>
      </div>
    ),
    answerText:
      "A Google Business Profile (GBP) audit is a comprehensive analysis of your business listing on Google Maps and Search. It evaluates key ranking factors like profile completeness, review quality, photo optimization, posting activity, and website performance to give you an actionable score and improvement plan.",
  },
  {
    question: "How does the GBP audit scoring system work?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Our scoring engine evaluates your profile across 6 key categories: Profile
          Completeness, Review Signals, Visual Content, Activity & Engagement, Website
          Performance, and Competitive Position. Each category is weighted based on its
          impact on local search rankings, and your total score (0–100) determines your
          grade from A (excellent) to F (needs work).
        </p>
      </div>
    ),
    answerText:
      "Our scoring engine evaluates your profile across 6 key categories: Profile Completeness, Review Signals, Visual Content, Activity & Engagement, Website Performance, and Competitive Position. Each category is weighted based on its impact on local search rankings, and your total score (0-100) determines your grade from A (excellent) to F (needs work).",
  },
  {
    question: "Is LocalScore free to use?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Yes! You can run a free GBP audit for any business without signing up.
          The free audit includes your overall score, grade, key issues, and a
          personalized action plan. Paid credit packs unlock additional audits,
          detailed reports, PDF exports, and competitor benchmarking.
        </p>
      </div>
    ),
    answerText:
      "Yes! You can run a free GBP audit for any business without signing up. The free audit includes your overall score, grade, key issues, and a personalized action plan. Paid credit packs unlock additional audits, detailed reports, PDF exports, and competitor benchmarking.",
  },
  {
    question: "What data sources does the audit use?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Our tool pulls data from multiple sources for maximum accuracy: Google Maps
          data for business details, reviews, and photos; Google PageSpeed Insights for
          website performance and mobile-friendliness; and competitive analysis from
          local search results. This multi-source approach gives you the most complete
          picture of your GBP health.
        </p>
      </div>
    ),
    answerText:
      "Our tool pulls data from multiple sources for maximum accuracy: Google Maps data for business details, reviews, and photos; Google PageSpeed Insights for website performance and mobile-friendliness; and competitive analysis from local search results. This multi-source approach gives you the most complete picture of your GBP health.",
  },
  {
    question: "How often should I audit my Google Business Profile?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          We recommend auditing your GBP at least once a month. Google frequently
          updates its ranking algorithms and competitors are constantly improving
          their profiles. Regular audits help you catch issues early — like unanswered
          reviews, stale photos, or missing business attributes — before they impact
          your local search visibility.
        </p>
      </div>
    ),
    answerText:
      "We recommend auditing your GBP at least once a month. Google frequently updates its ranking algorithms and competitors are constantly improving their profiles. Regular audits help you catch issues early — like unanswered reviews, stale photos, or missing business attributes — before they impact your local search visibility.",
  },
  {
    question: "What is a good GBP audit score?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          A score of 80+ (Grade A) means your profile is well-optimized for local
          search. Most businesses score between 40–65 on their first audit. Here&apos;s
          the breakdown:
        </p>
        <ul className="list-disc list-inside text-sm space-y-1 ml-2">
          <li><strong>A (80–100):</strong> Excellent — top performer in your market</li>
          <li><strong>B (65–79):</strong> Good — minor improvements can boost visibility</li>
          <li><strong>C (50–64):</strong> Average — several optimization opportunities exist</li>
          <li><strong>D (35–49):</strong> Below average — significant improvements needed</li>
          <li><strong>F (0–34):</strong> Poor — critical issues are hurting your rankings</li>
        </ul>
      </div>
    ),
    answerText:
      "A score of 80+ (Grade A) means your profile is well-optimized for local search. Most businesses score between 40-65 on their first audit. A (80-100) is excellent, B (65-79) is good, C (50-64) is average, D (35-49) is below average, and F (0-34) indicates critical issues.",
  },
  {
    question: "Can I audit a competitor's Google Business Profile?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          Absolutely! Just enter any business name and location to run an audit.
          This is a powerful way to benchmark your profile against local competitors.
          Our tool also automatically identifies and analyzes the top competitors in
          your category and area, showing you exactly where you stand and what they&apos;re
          doing better.
        </p>
      </div>
    ),
    answerText:
      "Absolutely! Just enter any business name and location to run an audit. This is a powerful way to benchmark your profile against local competitors. Our tool also automatically identifies and analyzes the top competitors in your category and area, showing you exactly where you stand and what they're doing better.",
  },
  {
    question: "How do I improve my GBP audit score?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>
          After running your audit, you&#39;ll get a prioritized action plan with specific
          steps. The most impactful improvements typically include: responding to all
          reviews (aim for 100% response rate), adding at least 10+ high-quality photos,
          posting weekly updates, completing all business attributes, adding services with
          descriptions, and ensuring your website is mobile-friendly and loads quickly.
        </p>
      </div>
    ),
    answerText:
      "After running your audit, you'll get a prioritized action plan with specific steps. The most impactful improvements typically include: responding to all reviews, adding at least 10+ high-quality photos, posting weekly updates, completing all business attributes, adding services with descriptions, and ensuring your website is mobile-friendly and loads quickly.",
  },
];

// Generate JSON-LD structured data for SEO
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqList.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answerText,
    },
  })),
};

const Item = ({ item }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${isOpen && "rotate-180"
              }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${isOpen && "rotate-180 hidden"
              }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-200" id="faq">
      {/* JSON-LD structured data for Google rich results */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
          <p className="text-base-content/60 mt-4 text-sm leading-relaxed">
            Everything you need to know about our Google Business Profile audit tool.
            Can&apos;t find the answer you&apos;re looking for? Reach out to our support team.
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
