"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw } from "lucide-react";

interface Participant {
    id: string;
    name: string;
    bookTitle: string;
    wishlist: string;
}

export default function ParticipantList({ refreshTrigger }: { refreshTrigger: number }) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/participants");
            if (res.ok) {
                const data = await res.json();
                setParticipants(data);
            }
        } catch (error) {
            console.error("Failed to fetch participants", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
    }, [refreshTrigger]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-green-600" />
                    Participants ({participants.length})
                </h2>
                <button onClick={fetchParticipants} className="p-2 hover:bg-gray-100 rounded-full">
                    <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brought Book</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wishlist</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((p) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={p.bookTitle}>{p.bookTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={p.wishlist}>{p.wishlist}</td>
                            </tr>
                        ))}
                        {participants.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No participants yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
