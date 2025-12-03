"use client";

import { Participant } from "@/lib/data";
import { Gift, User, BookOpen, Quote } from "lucide-react";

interface MatchingResultProps {
  participants: Participant[];
}

export default function MatchingResult({ participants }: MatchingResultProps) {
  // Create a map to easily find donor details
  const participantMap = new Map(participants.map((p) => [p.id, p]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {participants.map((recipient) => {
        const donor = recipient.assignedBookId
          ? participantMap.get(recipient.assignedBookId)
          : null;

        if (!donor) return null;

        return (
          <div
            key={recipient.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-100 hover:shadow-xl transition-shadow"
          >
            <div className="bg-red-600 px-4 py-2 flex justify-between items-center">
              <span className="text-white font-bold flex items-center gap-2">
                <Gift className="w-4 h-4" /> Match Found!
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <User className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Recipient
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {recipient.name}
                  </p>
                </div>
              </div>

              <div className="border-l-4 border-red-200 pl-4 py-1">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  Receives
                </p>
                <div className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-gray-900">{donor.bookTitle}</p>
                    <p className="text-sm text-gray-600">
                      by {donor.bookAuthors.join(", ")}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      From: {donor.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <div className="flex gap-2">
                  <Quote className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                  <p className="text-sm text-gray-700 italic">
                    "{recipient.assignedReason}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
