"use client";

import { useState, useEffect } from "react";
import MatchingResult from "@/components/MatchingResult";
import { getParticipants, saveAllParticipants, Participant } from "@/lib/data";
import { Sparkles, ArrowLeft, Key } from "lucide-react";
import Link from "next/link";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function MatchPage() {
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [matched, setMatched] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Initial fetch from localStorage
        const data = getParticipants();
        setParticipants(data);
        // Check if any have matches
        if (data.length > 0 && data[0].assignedBookId) {
            setMatched(true);
        }
    }, []);

    const handleMatch = async () => {
        setLoading(true);
        setError("");

        if (!apiKey) {
            setError("API Key is required");
            setLoading(false);
            return;
        }

        if (participants.length < 2) {
            setError("Need at least 2 participants to match.");
            setLoading(false);
            return;
        }

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

            const prompt = `
        You are a Secret Santa matching engine.
        I have a list of participants, each brought a book and has a wishlist.
        
        Rules:
        1. Each participant must receive exactly one book.
        2. A participant CANNOT receive the book they brought.
        3. Try to match the book to the participant's wishlist as best as possible.
        4. Provide a fun, Christmas-themed reason for the match.
        
        Participants:
        ${JSON.stringify(participants.map(p => ({
                id: p.id,
                name: p.name,
                broughtBookId: p.id, // Using participant ID as book ID for simplicity since 1 person = 1 book
                broughtBookTitle: p.bookTitle,
                broughtBookAuthors: p.bookAuthors,
                wishlist: p.wishlist
            })), null, 2)}

        Output must be a valid JSON array of objects with the following structure:
        [
          {
            "recipientId": "participant_id",
            "assignedBookFromId": "donor_participant_id",
            "reason": "Reason for this match..."
          }
        ]
        Do not include markdown formatting like \`\`\`json. Just the raw JSON.
      `;

            console.log("Calling Gemini API...");
            const result = await model.generateContent(prompt);
            console.log("API Response received:", result);

            const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
            console.log("Parsed response text:", responseText);

            let matches;
            try {
                matches = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse AI response", responseText, e);
                setError("AI returned invalid format. Please try again.");
                setLoading(false);
                return;
            }

            // Update participants with match data
            const updatedParticipants = participants.map(p => {
                const match = matches.find((m: any) => m.recipientId === p.id);
                if (match) {
                    return {
                        ...p,
                        assignedBookId: match.assignedBookFromId,
                        assignedReason: match.reason
                    };
                }
                return p;
            });

            saveAllParticipants(updatedParticipants);
            setParticipants(updatedParticipants);
            setMatched(true);

        } catch (err: any) {
            console.error("Matching error:", err);

            // Provide more specific error messages
            let errorMessage = "An error occurred during matching.";

            if (err.message?.includes("API_KEY_INVALID") || err.message?.includes("API key")) {
                errorMessage = "Invalid API key. Please check your Gemini API key and try again.";
            } else if (err.message?.includes("quota") || err.message?.includes("limit")) {
                errorMessage = "API quota exceeded. Please try again later or check your API limits.";
            } else if (err.message?.includes("network") || err.message?.includes("fetch")) {
                errorMessage = "Network error. Please check your internet connection.";
            } else if (err.message) {
                errorMessage = `Error: ${err.message}`;
            }

            setError(errorMessage);
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
                                    placeholder="Enter your API Key"
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
