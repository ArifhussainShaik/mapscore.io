import fs from 'fs';
import path from 'path';

// Manual parser for .env.local to avoid dependency issues
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    } catch (e) {
        console.warn("⚠️ Could not load .env.local manually:", e.message);
    }
}

loadEnv();

async function checkGooglePlaces() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
        return "❌ Google Places API: key not found in .env.local";
    }

    try {
        const placeId = "ChIJD7fiBh9u5kcRYJSMaMOCCwQ"; // Valid Place ID (Eiffel Tower)
        const fieldMask = "id,displayName";

        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            method: "GET",
            headers: {
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": fieldMask,
                "Content-Type": "application/json",
            },
            signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
            return `✅ Google Places API: Connected (Status: ${response.status})`;
        } else {
            return `❌ Google Places API: Failed (Status: ${response.status} - ${await response.text()})`;
        }
    } catch (e) {
        return `❌ Google Places API: Error (${e.message})`;
    }
}

async function checkSerper() {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        return "❌ Serper API: key not found in .env.local";
    }

    try {
        const response = await fetch("https://google.serper.dev/maps", {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: "pizza in New York",
                num: 1,
            }),
            signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
            return `✅ Serper API: Connected (Status: ${response.status})`;
        } else {
            return `❌ Serper API: Failed (Status: ${response.status} - ${await response.text()})`;
        }
    } catch (e) {
        return `❌ Serper API: Error (${e.message})`;
    }
}

async function checkOutscraper() {
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    if (!apiKey) {
        return "❌ Outscraper API: key not found in .env.local";
    }

    try {
        const params = new URLSearchParams({
            query: "pizza in New York",
            limit: "1",
            language: "en",
            async: "false",
        });

        // Use search-v3 ping
        const response = await fetch(`https://api.app.outscraper.com/maps/search-v3?${params.toString()}`, {
            method: "GET",
            headers: {
                "X-API-KEY": apiKey,
            },
            signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
            return `✅ Outscraper API: Connected (Status: ${response.status})`;
        } else {
            return `❌ Outscraper API: Failed (Status: ${response.status} - ${await response.text()})`;
        }
    } catch (e) {
        return `❌ Outscraper API: Error (${e.message})`;
    }
}

async function runHealthCheck() {
    console.log("=== API Providers Health Check ===");
    console.log("Fetching credentials from .env.local...\n");

    const [googleResult, serperResult, outscraperResult] = await Promise.all([
        checkGooglePlaces(),
        checkSerper(),
        checkOutscraper()
    ]);

    console.log(googleResult);
    console.log(serperResult);
    console.log(outscraperResult);
    console.log("\n=== Health Check Complete ===");
}

runHealthCheck();
