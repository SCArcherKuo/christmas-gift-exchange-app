"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, Trash2 } from "lucide-react";
import { getParticipants, Participant, deleteParticipant, clearAllParticipants } from "@/lib/data";

export default function ParticipantList({ refreshTrigger }: { refreshTrigger: number }) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchParticipants = () => {
        setLoading(true);
        // Simulate async for UI consistency
        setTimeout(() => {
            const data = getParticipants();
            setParticipants(data);
            setLoading(false);
        }, 300);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this participant?")) {
            deleteParticipant(id);
            fetchParticipants();
        }
    };

    const handleClearAll = () => {
        if (confirm("Are you sure you want to delete ALL participants? This cannot be undone.")) {
            clearAllParticipants();
            fetchParticipants();
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
                <div className="flex gap-2">
                    {participants.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear All
                        </button>
                    )}
                    <button onClick={fetchParticipants} className="p-2 hover:bg-gray-100 rounded-full">
                        <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brought Book</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wishlist</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {participants.map((p) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={p.bookTitle}>{p.bookTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={p.wishlist}>{p.wishlist}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleDelete(p.id)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                        title="Delete participant"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {participants.length === 0 && !loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No participants yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
