"use client";

import {
    Radar,
    RadarChart as RechartsRadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from "recharts";

// Max points per section from scoring-rules.json
const SECTION_MAX = {
    profile: 32,
    reviews: 25,
    visual: 13,
    activity: 10,
    website: 12,
    competitive: 8,
};

const SECTION_LABELS = {
    profile: "Profile Setup",
    reviews: "Reputation",
    visual: "Visual Assets",
    activity: "Engagement",
    website: "Website & SEO",
    competitive: "Market Position",
};

export default function RadarChart({ sectionScores }) {
    if (!sectionScores) return null;

    // Format data for Recharts: { subject: "Profile", A: 80, fullMark: 100 }
    // We normalize to percentage (0-100) so the radar is visually balanced
    const data = Object.keys(SECTION_MAX).map((key) => {
        const rawScore = sectionScores[key] || 0;
        const maxScore = SECTION_MAX[key];
        const percentage = Math.round((rawScore / maxScore) * 100);

        return {
            subject: SECTION_LABELS[key] || key,
            score: percentage,
            rawScore,
            maxScore,
            fullMark: 100,
        };
    });

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const { subject, score, rawScore, maxScore } = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-base-200 shadow-xl rounded-lg text-sm">
                    <p className="font-bold text-base-content mb-1">{subject}</p>
                    <div className="flex justify-between gap-4">
                        <span className="text-base-content/70">Optimization:</span>
                        <span className="font-semibold text-primary">{score}%</span>
                    </div>
                    <div className="flex justify-between gap-4">
                        <span className="text-base-content/70">Points:</span>
                        <span className="font-medium">{rawScore} / {maxScore}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[350px] font-sans">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#f97316"
                        strokeWidth={2}
                        fill="#f97316"
                        fillOpacity={0.4}
                    />
                    <Tooltip content={<CustomTooltip />} />
                </RechartsRadarChart>
            </ResponsiveContainer>
        </div>
    );
}
