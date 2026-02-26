const config = {
  // REQUIRED
  appName: "LocalScore",
  // REQUIRED: a short description of your app for SEO tags
  appDescription:
    "How healthy is your Google Business Profile? Get a free, instant audit with actionable tips to attract more local customers. No signup required.",
  // REQUIRED (no https://, no trailing slash)
  domainName: "localscore.io",
  crisp: {
    id: "",
    onlyShowOnRoutes: ["/"],
  },
  dodo: {
    plans: [
      {
        isFeatured: true,
        productId: "prd_test_pro_plan", // TODO: Replace with real Product ID from Dodo Dashboard
        name: "Pro",
        description: "For freelancers & consultants",
        price: 29,
        currency: "USD",
        interval: "month",
        features: [
          { name: "Unlimited audits" },
          { name: "Full detailed reports" },
          { name: "PDF export" },
          { name: "Competitor comparison (top 3)" },
          { name: "Weekly re-scan alerts" },
          { name: "Priority action list" },
        ],
      },
      {
        productId: "prd_test_agency_plan", // TODO: Replace with real Product ID from Dodo Dashboard
        name: "Agency",
        description: "For teams & agencies",
        price: 79,
        currency: "USD",
        interval: "month",
        features: [
          { name: "Everything in Pro" },
          { name: "Bulk audit (50 profiles)" },
          { name: "Custom branding on PDFs" },
          { name: "Client-ready presentation" },
          { name: "API access" },
        ],
      },
    ],
  },
  aws: {
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    fromNoReply: `Mapscore <noreply@mapscore.io>`,
    fromAdmin: `Mapscore Team <team@mapscore.io>`,
    supportEmail: "support@mapscore.io",
  },
  colors: {
    theme: "light",
    main: "#2563eb",
  },
  auth: {
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
  // Scoring
  scoring: {
    freeTierLimit: 3, // audits per month
    cacheDays: 7,
  },
};

export default config;
