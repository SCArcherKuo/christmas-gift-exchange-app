"use client";

import { useEffect, useState } from "react";
import { Users, RefreshCw, Trash2 } from "lucide-react";
import {
  getParticipants,
  deleteParticipant,
  Participant,
  getFullName,
} from "@/lib/data";
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
      console.error("刪除失敗", error);
      alert("刪除參加者失敗。");
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
          參加者 ({participants.length})
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                姓
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                攜帶書籍
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                願望清單
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {participants.map((p) => (
              <tr key={p.id}>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  title={p.id}
                >
                  {p.id.substring(0, 8)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {p.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {p.firstName}
                </td>
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-xs"
                  title={p.email}
                >
                  {p.email}
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
                      <span className="text-gray-400 italic">無描述</span>
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
                    title="刪除參加者"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {participants.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  尚無參加者。
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
        title="刪除參加者"
        message={`您確定要刪除 ${participantToDelete ? getFullName(participantToDelete) : ""} 嗎？此操作無法復原。`}
        isDeleting={isDeleting}
      />
    </div>
  );
}
