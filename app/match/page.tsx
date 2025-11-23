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
        // Initial fetch
        const fetchData = async () => {
            const data = await getParticipants();
            setParticipants(data);
            // Check if any have matches
            if (data.length > 0 && data[0].assignedBookId) {
                setMatched(true);
            }
        };
        fetchData();
    }, []);

    const handleMatch = async () => {
        setLoading(true);
        setError("");

        if (!apiKey) {
            setError("API Key is required");
            setLoading(false);
            return;
        }

        // Refresh participants before matching to ensure we have latest
        const currentParticipants = await getParticipants();
        if (currentParticipants.length < 2) {
            setError("Need at least 2 participants to match.");
            setLoading(false);
            return;
        }
        setParticipants(currentParticipants);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            // Using the latest stable flash model as requested
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `
        You are a Secret Santa matching engine.
        I have a list of participants, each brought a book and has a wishlist.
        
        Rules:
        1. Each participant must receive exactly one book.
        2. A participant CANNOT receive the book they brought.
        3. Try to match the book to the participant's wishlist as best as possible.
        4. USE THE BOOK DESCRIPTION to understand the book's content and match it to the wishlist.
        5. Provide a fun, Christmas-themed reason for the match, referencing the book's content.
        
        Participants:
        ${JSON.stringify(currentParticipants.map(p => ({
                id: p.id,
                name: p.name,
                broughtBookId: p.id, // Using participant ID as book ID for simplicity since 1 person = 1 book
                broughtBookTitle: p.bookTitle,
                broughtBookAuthors: p.bookAuthors,
                broughtBookDescription: p.bookDescription, // Added description
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

            const result = await model.generateContent(prompt);
            const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

            let matches;
            try {
                matches = JSON.parse(responseText);
            } catch (e) {
                console.error("Failed to parse AI response", responseText);
                setError("AI returned invalid format");
                setLoading(false);
                return;
            }

            // Update participants with match data
            const updatedParticipants = currentParticipants.map(p => {
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

            await saveAllParticipants(updatedParticipants);
            setParticipants(updatedParticipants);
            setMatched(true);

        } catch (err) {
            console.error("Matching error:", err);
            setError("An error occurred during matching. Check your API Key.");
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
