import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually to avoid missing module errors
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || "";
            // Remove quotes if present
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            process.env[key] = value;
        }
    });
}

async function runDiagnostic() {
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    if (!apiKey) {
        console.error("Missing OUTSCRAPER_API_KEY in .env.local");
        process.exit(1);
    }

    const placeId = "209 NYC Dental New York";
    const query = encodeURIComponent(placeId);

    console.log(`Fetching raw Outscraper data for Place ID: ${placeId}...`);

    const url = `https://api.app.outscraper.com/maps/search-v3?query=${query}&limit=1&language=en&async=false`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-API-KEY": apiKey,
            },
        });

        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            console.error(await response.text());
            process.exit(1);
        }

        const data = await response.json();

        console.log("\n================ FULL RAW JSON RESPONSE ================\n");
        console.log(JSON.stringify(data, null, 2));
        console.log("\n========================================================\n");

    } catch (err) {
        console.error("Fetch failed:", err);
    }
}

runDiagnostic();
