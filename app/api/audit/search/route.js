import { NextResponse } from "next/server";
import { searchBusiness, isSerperConfigured } from "@/libs/serper";

export async function POST(req) {
    try {
        const { businessName, city } = await req.json();

        if (!businessName) {
            return NextResponse.json(
                { error: "Business name is required" },
                { status: 400 }
            );
        }

        if (!isSerperConfigured()) {
            return NextResponse.json(
                {
                    results: [],
                    query: { businessName, city },
                    source: "none",
                    message: "Search API is not configured. Please set SERPER_API_KEY.",
                },
                { status: 200 }
            );
        }

        const results = await searchBusiness(businessName, city);

        return NextResponse.json({
            results,
            query: { businessName, city },
            source: "serper",
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json(
            { error: "Failed to search for business" },
            { status: 500 }
        );
    }
}
