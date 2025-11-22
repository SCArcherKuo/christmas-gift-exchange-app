"use client";

import { useState } from "react";
import Scanner from "./Scanner";
import { Book, Loader2, CheckCircle, XCircle } from "lucide-react";
import { saveParticipant } from "@/lib/data";

interface BookDetails {
    title: string;
    authors: string[];
    description: string;
    thumbnail: string;
}

export default function EntryForm({ onEntryAdded }: { onEntryAdded: () => void }) {
    const [name, setName] = useState("");
    const [id, setId] = useState("");
    const [isbn, setIsbn] = useState("");
    const [wishlist, setWishlist] = useState("");
    const [bookDetails, setBookDetails] = useState<BookDetails | null>(null);
    const [loadingBook, setLoadingBook] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            // Direct client-side save
            saveParticipant({
                id,
                name,
                bookIsbn: isbn,
                bookTitle: bookDetails?.title || "Unknown Title",
                bookAuthors: bookDetails?.authors || [],
                wishlist,
            });

            setMessage({ type: "success", text: "Participant added successfully!" });
            // Reset form
            setName("");
            setId("");
            setIsbn("");
            setWishlist("");
            setBookDetails(null);
            onEntryAdded();

        } catch (error) {
            setMessage({ type: "error", text: "An error occurred." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <Book className="w-6 h-6 text-red-600" />
                New Entry
            </h2>

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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2 border"
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
                    {submitting ? "Adding..." : "Add Participant"}
                </button>

                {message && (
                    <div className={`p-3 rounded-md flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}
