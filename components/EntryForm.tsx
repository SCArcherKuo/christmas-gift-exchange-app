"use client";

import { useState, useEffect } from "react";
import Scanner from "./Scanner";
import { Book, Loader2, CheckCircle, XCircle, Search, UserCheck, UserPlus } from "lucide-react";
import { saveParticipant, getParticipants, Participant } from "@/lib/data";

interface BookDetails {
    title: string;
    authors: string[];
    description: string;
    thumbnail: string;
}

export default function EntryForm({ onEntryAdded }: { onEntryAdded: () => void }) {
    const [mode, setMode] = useState<"checkin" | "new">("checkin");
    const [existingParticipants, setExistingParticipants] = useState<Participant[]>([]);
    const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [isbn, setIsbn] = useState("");
    const [wishlist, setWishlist] = useState("");
    const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
    const [loadingBook, setLoadingBook] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Load participants for search
    useEffect(() => {
        loadParticipants();
    }, []);

    const loadParticipants = async () => {
        const data = await getParticipants();
        setExistingParticipants(data);
    };

    const handleScan = (code: string) => {
        if (code !== isbn) {
            setIsbn(code);
            fetchBookDetails(code);
        }
    };

    const fetchBookDetails = async (code: string) => {
        setLoadingBook(true);
        setBookDetails(null);
        try {
            const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${code}`);
            if (res.ok) {
                const data = await res.json();
                if (data.totalItems > 0 && data.items) {
                    const book = data.items[0].volumeInfo;
                    setBookDetails({
                        title: book.title,
                        authors: book.authors || [],
                        description: book.description || "",
                        thumbnail: book.imageLinks?.thumbnail || "",
                    });
                }
            } else {
                console.error("Book not found");
            }
        } catch (error) {
            console.error("Error fetching book", error);
        } finally {
            setLoadingBook(false);
        }
    };

    const handleSelectParticipant = (p: Participant) => {
        setSelectedParticipantId(p.id);
        setName(p.name);
        setId(p.id);
        setWishlist(p.wishlist);
        // If they already have a book, maybe warn or show it?
        if (p.bookIsbn) {
            setMessage({ type: "error", text: "Warning: This participant already has a book checked in." });
            setIsbn(p.bookIsbn);
            fetchBookDetails(p.bookIsbn);
        } else {
            setMessage(null);
            setIsbn("");
            setBookDetails(null);
        }
        setSearchQuery("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            await saveParticipant({
                id,
                name,
                bookIsbn: isbn,
                bookTitle: bookDetails?.title || "Unknown Title",
                bookAuthors: bookDetails?.authors || [],
                wishlist,
            });

            setMessage({ type: "success", text: mode === "checkin" ? "Check-in successful!" : "Participant added!" });

            // Reset form
            if (mode === "new") {
                setName("");
                setId("");
                setWishlist("");
            } else {
                setSelectedParticipantId(null);
                setName("");
                setId("");
                setWishlist("");
            }
            setIsbn("");
            setBookDetails(null);

            // Refresh list
            setTimeout(() => {
                onEntryAdded();
                loadParticipants(); // Reload for next search
            }, 1000);

        } catch (error) {
            setMessage({ type: "error", text: "An error occurred." });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredParticipants = existingParticipants.filter(p =>
        String(p.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.id).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Book className="w-6 h-6 text-red-600" />
                    {mode === "checkin" ? "Event Check-in" : "New Registration"}
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setMode("checkin"); setMessage(null); }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === "checkin" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Check-in
                    </button>
                    <button
                        onClick={() => { setMode("new"); setMessage(null); setSelectedParticipantId(null); setName(""); setId(""); setWishlist(""); }}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${mode === "new" ? "bg-white shadow text-red-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        New
                    </button>
                </div>
            </div>

            {mode === "checkin" && !selectedParticipantId && (
                <div className="mb-6 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Search Pre-registered Participant</label>
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Name or ID..."
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-3 border"
                        />
                    </div>
                    {searchQuery && (
                        <div className="absolute z-10 w-full bg-white mt-1 border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredParticipants.length > 0 ? (
                                filteredParticipants.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSelectParticipant(p)}
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 flex justify-between items-center border-b border-gray-100 last:border-0"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">{p.name}</p>
                                            <p className="text-xs text-gray-500">ID: {p.id}</p>
                                        </div>
                                        {p.bookIsbn ? <CheckCircle className="w-4 h-4 text-green-500" /> : <UserCheck className="w-4 h-4 text-gray-400" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">No participants found.</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {(mode === "new" || selectedParticipantId) && (
                <div className="animate-fade-in">
                    {selectedParticipantId && (
                        <div className="mb-6 bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm text-blue-700 font-medium">Checking in: <span className="font-bold">{name}</span></p>
                                <p className="text-xs text-blue-500">ID: {id}</p>
                            </div>
                            <button onClick={() => setSelectedParticipantId(null)} className="text-xs text-blue-600 hover:underline">Change</button>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scan Book Barcode</label>
                        <Scanner onScanSuccess={handleScan} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Participant Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={mode === "checkin"} // Disable editing name in checkin mode
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="Santa Claus"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Participant ID</label>
                                <input
                                    type="text"
                                    required
                                    value={id}
                                    onChange={(e) => setId(e.target.value)}
                                    disabled={mode === "checkin"} // Disable editing ID in checkin mode
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="001"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">ISBN</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    required
                                    value={isbn}
                                    onChange={(e) => setIsbn(e.target.value)}
                                    onBlur={() => isbn && fetchBookDetails(isbn)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                    placeholder="978..."
                                />
                                <button
                                    type="button"
                                    onClick={() => fetchBookDetails(isbn)}
                                    disabled={loadingBook || !isbn}
                                    className="mt-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                >
                                    Lookup
                                </button>
                            </div>
                        </div>

                        {loadingBook && <div className="text-sm text-gray-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Fetching book info...</div>}

                        {bookDetails && (
                            <div className="bg-gray-50 p-4 rounded-lg flex gap-4 items-start border border-gray-200">
                                {bookDetails.thumbnail && (
                                    <img src={bookDetails.thumbnail} alt="Cover" className="w-16 h-24 object-cover rounded shadow-sm" />
                                )}
                                <div>
                                    <h3 className="font-semibold text-gray-900">{bookDetails.title}</h3>
                                    <p className="text-sm text-gray-600">{bookDetails.authors.join(", ")}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Wishlist / Preferences</label>
                            <textarea
                                required
                                value={wishlist}
                                onChange={(e) => setWishlist(e.target.value)}
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
                                placeholder="I like sci-fi and mystery novels..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                            {submitting ? "Saving..." : (mode === "checkin" ? "Check In & Update" : "Add Participant")}
                        </button>

                        {message && (
                            <div className={`p-3 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                {message.text}
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
}
