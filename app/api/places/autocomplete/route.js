import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.trim().length < 4) {
        return NextResponse.json({ predictions: [] });
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
        console.error("[Autocomplete] GOOGLE_PLACES_API_KEY is not configured");
        return NextResponse.json({
            predictions: [],
            error: "Google Places API is not configured",
        });
    }

    try {
        // Google Places Autocomplete API (New)
        const response = await fetch(
            "https://places.googleapis.com/v1/places:autocomplete",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": apiKey,
                },
                body: JSON.stringify({
                    input: query,
                    includedPrimaryTypes: ["establishment"],
                    languageCode: "en",
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Google Places API error:", response.status, errorText.slice(0, 300));
            return NextResponse.json({ predictions: [] });
        }

        const data = await response.json();

        const predictions = (data.suggestions || [])
            .filter((s) => s.placePrediction)
            .slice(0, 5)
            .map((s) => ({
                placeId: s.placePrediction.placeId,
                name: s.placePrediction.structuredFormat?.mainText?.text || "",
                address:
                    s.placePrediction.structuredFormat?.secondaryText?.text || "",
                description: s.placePrediction.text?.text || "",
            }));

        return NextResponse.json({ predictions });
    } catch (error) {
        console.error("Places autocomplete error:", error);
        return NextResponse.json({ predictions: [] });
    }
}
