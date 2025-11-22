"use client";

import { useState, useEffect } from "react";
import MatchingResult from "@/components/MatchingResult";
import { Participant } from "@/lib/data";
import { Sparkles, ArrowLeft, Key } from "lucide-react";
import Link from "next/link";

export default function MatchPage() {
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [matched, setMatched] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Initial fetch to see if we already have matches
        fetch("/api/participants")
            .then(res => res.json())
            .then(data => {
                setParticipants(data);
                // Check if any have matches
                if (data.length > 0 && data[0].assignedBookId) {
                    setMatched(true);
                }
            });
    }, []);

    const handleMatch = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey }),
            });

            const data = await res.json();

            if (res.ok) {
                setParticipants(data.matches);
                setMatched(true);
            } else {
                setError(data.error || "Matching failed");
            }
        } catch (err) {
            setError("An error occurred during matching");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <Link href="/" className="inline-flex items-center text-gray-600 hover:text-red-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Entry
                </Link>

                <header className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
                        <Sparkles className="w-8 h-8 text-yellow-500" />
                        Gift Exchange Matching
                        <Sparkles className="w-8 h-8 text-yellow-500" />
                    </h1>
                    <p className="text-gray-600 mt-2">Let the AI magic find the perfect book for everyone!</p>
                </header>

                {!matched && (
                    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-md mb-10">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Google Gemini API Key</label>
                            <div className="relative">
                                <Key className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter your API Key (optional if env set)"
                                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Required for the AI magic to work.</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleMatch}
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-all transform hover:scale-105"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-spin" /> Matching...
                                </span>
                            ) : (
                                "Start Matching Magic ✨"
                            )}
                        </button>
                    </div>
                )}

                {matched && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Pairing Results</h2>
                            <button
                                onClick={() => setMatched(false)}
                                className="text-sm text-red-600 hover:underline"
                            >
                                Reset / Rematch
                            </button>
                        </div>
                        <MatchingResult participants={participants} />
                    </div>
                )}
            </div>
        </div>
    );
}
