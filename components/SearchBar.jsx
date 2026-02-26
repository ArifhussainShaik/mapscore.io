"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar({ variant = "hero" }) {
    const router = useRouter();
    const [businessName, setBusinessName] = useState("");
    const [city, setCity] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [placeId, setPlaceId] = useState(null);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const searchPlaces = useCallback(async (query) => {
        if (query.trim().length < 4) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetch(
                `/api/places/autocomplete?query=${encodeURIComponent(query)}`
            );
            const data = await res.json();
            setSuggestions(data.predictions || []);
            setShowSuggestions(true);
            setActiveIndex(-1);
        } catch {
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Handle business name input change
    const handleBusinessNameChange = (e) => {
        const value = e.target.value;
        setBusinessName(value);
        setPlaceId(null); // Reset placeId when user types

        // Debounce the API call (300ms)
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            searchPlaces(value);
        }, 300);
    };

    // Handle selecting a suggestion
    const handleSelectSuggestion = (suggestion) => {
        const fullText = suggestion.address
            ? `${suggestion.name}, ${suggestion.address}`
            : suggestion.name;

        setBusinessName(fullText);
        setPlaceId(suggestion.placeId);
        setShowSuggestions(false);
        setSuggestions([]);

        // Extract city from address
        if (suggestion.address) {
            setCity(suggestion.address);
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((prev) =>
                prev < suggestions.length - 1 ? prev + 1 : 0
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((prev) =>
                prev > 0 ? prev - 1 : suggestions.length - 1
            );
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            handleSelectSuggestion(suggestions[activeIndex]);
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!placeId) return;

        setIsLoading(true);
        setShowSuggestions(false);

        // Pass placeId if a suggestion was selected
        const params = new URLSearchParams({
            business: businessName,
            city: city,
        });
        if (placeId) params.set("placeId", placeId);

        router.push(`/audit/demo?${params.toString()}`);
    };

    const isHero = variant === "hero";

    return (
        <form onSubmit={handleSubmit} className={`w-full ${isHero ? "max-w-3xl mx-auto" : "max-w-xl"}`}>
            <div
                className={`flex flex-col sm:flex-row items-center ${isHero
                    ? "bg-white p-2 rounded-full w-full mx-auto shadow-sm border border-slate-100"
                    : "p-2 rounded-xl bg-base-200/50 border border-base-content/10 gap-3"
                    }`}
            >
                {/* Business Name Input with Autocomplete */}
                <div className="flex-1 relative w-full" ref={wrapperRef}>
                    {isHero ? (
                        <svg
                            className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 z-10"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                    ) : (
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400 opacity-70 z-10"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                            />
                        </svg>
                    )}

                    {/* Searching spinner */}
                    {isSearching && (
                        <span className={`absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-xs z-10 ${isHero ? "text-blue-600" : "text-emerald-400"}`} />
                    )}

                    <input
                        type="text"
                        placeholder={isHero ? "e.g., Joe's Pizza, Brooklyn NY" : "Search your business name..."}
                        value={businessName}
                        onChange={handleBusinessNameChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0) setShowSuggestions(true);
                        }}
                        autoComplete="off"
                        className={`w-full focus:outline-none transition-colors ${isHero
                            ? "h-14 bg-transparent border-0 text-slate-800 placeholder-slate-400 pl-14 pr-12 text-base font-medium"
                            : "input input-bordered h-12 bg-transparent border-base-content/10 focus:border-emerald-500 pl-10 pr-10"
                            }`}
                        required
                    />

                    {/* Clear button */}
                    {businessName.length > 0 && !isSearching && (
                        <button
                            type="button"
                            onClick={() => {
                                setBusinessName("");
                                setPlaceId(null);
                                setCity("");
                                setSuggestions([]);
                                setShowSuggestions(false);
                            }}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-1 transition-colors ${isHero ? "text-slate-400 hover:text-slate-600" : "text-base-content/40 hover:text-base-content/80"}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}

                    {/* Suggestions Dropdown */}
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#111827] border border-base-content/10 rounded-xl shadow-2xl overflow-hidden">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={suggestion.placeId}
                                    type="button"
                                    onClick={() => handleSelectSuggestion(suggestion)}
                                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors
                                        ${index === activeIndex
                                            ? "bg-emerald-500/10 border-l-2 border-emerald-400"
                                            : "hover:bg-base-content/5 border-l-2 border-transparent"
                                        }
                                        ${index < suggestions.length - 1 ? "border-b border-base-content/5" : ""}
                                    `}
                                >
                                    <span className="text-emerald-400 mt-0 flex-shrink-0">📍</span>
                                    <div className="min-w-0 flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {suggestion.name}
                                        </p>
                                        {suggestion.address && (
                                            <p className="text-xs text-base-content/60 truncate">
                                                — {suggestion.address}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            ))}
                            <div className="px-4 py-2 text-[10px] text-base-content/30 bg-base-content/3 flex items-center gap-1">
                                <span>Powered by Google</span>
                            </div>
                        </div>
                    )}

                    {/* No results state */}
                    {showSuggestions && suggestions.length === 0 && businessName.length >= 3 && !isSearching && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#111827] border border-base-content/10 rounded-xl shadow-2xl p-4 text-center">
                            <p className="text-sm text-base-content/50">
                                No businesses found on Google Maps. Please refine your search.
                            </p>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !placeId}
                    className={`font-bold flex items-center justify-center whitespace-nowrap transition-colors disabled:opacity-50 ${isHero
                        ? "h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 text-sm sm:text-base w-full sm:w-auto"
                        : "btn btn-brand px-6"
                        }`}
                >
                    {isLoading ? (
                        <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                        isHero ? "Get Free Audit" : (
                            <>
                                Start Audit
                                <svg
                                    className="w-5 h-5 ml-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                    />
                                </svg>
                            </>
                        )
                    )}
                </button>
            </div>
        </form >
    );
}
