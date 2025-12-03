"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { getParticipants, deleteParticipant, Participant } from "@/lib/data";
import DeleteConfirmModal from "./DeleteConfirmModal";

export default function ParticipantList({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [participantToDelete, setParticipantToDelete] =
    useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const data = await getParticipants();
      setParticipants(data);
    } catch (error) {
      console.error("Failed to fetch participants", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [refreshTrigger]);

  const handleDeleteClick = (
    participant: Participant,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setParticipantToDelete(participant);
  };

  const handleConfirmDelete = async () => {
    if (!participantToDelete) return;

    setIsDeleting(true);
    try {
      await deleteParticipant(participantToDelete.id);
      await fetchParticipants();
    } catch (error) {
      console.error("Failed to delete", error);
      alert("Failed to delete participant.");
    } finally {
      setIsDeleting(false);
      setParticipantToDelete(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-6 h-6 text-green-600" />
          Participants ({participants.length})
        </h2>
        <button
          onClick={fetchParticipants}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-500 ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brought Book
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Wishlist
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((p) => (
              <tr key={p.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {p.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {p.name}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs"
                  title={p.bookTitle}
                >
                  {p.bookTitle}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                  <div
                    className="line-clamp-2"
                    title={p.bookDescription || "No description"}
                  >
                    {p.bookDescription || (
                      <span className="text-gray-400 italic">
                        No description
                      </span>
                    )}
                  </div>
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs"
                  title={p.wishlist}
                >
                  {p.wishlist}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(p, e)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title="Delete participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {participants.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  No participants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={!!participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Participant"
        message={`Are you sure you want to delete ${participantToDelete?.name}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
