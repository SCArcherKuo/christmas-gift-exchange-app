"use client";

import { Participant, getFullName } from "@/lib/data";
import { Gift, User, BookOpen, Quote } from "lucide-react";

interface MatchingResultProps {
  participants: Participant[];
}

export default function MatchingResult({ participants }: MatchingResultProps) {
  // Create a map to easily find donor details - ensure all IDs are strings
  const participantMap = new Map(participants.map((p) => [String(p.id), p]));

  // Get the recipients (participants who have been assigned books)
  const recipients = participants.filter((p) => p.assignedBookId);

  // Helper function to get group color theme
  const getGroupColors = (group?: string) => {
    if (group === "red") {
      return {
        headerBg: "bg-red-600",
        headerText: "text-white",
        borderColor: "border-red-100",
        iconBg: "bg-red-100",
        iconColor: "text-red-700",
        accentColor: "text-red-500",
        borderAccent: "border-red-200",
      };
    } else if (group === "brown") {
      return {
        headerBg: "bg-amber-700",
        headerText: "text-white",
        borderColor: "border-amber-100",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-700",
        accentColor: "text-amber-600",
        borderAccent: "border-amber-200",
      };
    }
    // Fallback for no group assignment
    return {
      headerBg: "bg-gray-600",
      headerText: "text-white",
      borderColor: "border-gray-100",
      iconBg: "bg-gray-100",
      iconColor: "text-gray-700",
      accentColor: "text-gray-500",
      borderAccent: "border-gray-200",
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {recipients.map((recipient) => {
        const donor = participantMap.get(String(recipient.assignedBookId!));
        if (!donor) return null;

        const colors = getGroupColors(donor.group);

        return (
          <div
            key={recipient.id}
            className={`bg-white rounded-xl shadow-lg overflow-hidden border ${colors.borderColor} hover:shadow-xl transition-shadow`}
          >
            <div
              className={`${colors.headerBg} px-4 py-2 flex justify-between items-center`}
            >
              <span
                className={`${colors.headerText} font-bold flex items-center gap-2`}
              >
                <Gift className="w-4 h-4" />
                {donor.group === "red"
                  ? "紅組"
                  : donor.group === "brown"
                    ? "棕組"
                    : "送禮者"}
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`${colors.iconBg} p-2 rounded-full`}>
                  <User className={`w-6 h-6 ${colors.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    送禮者
                  </p>
                  <p className="text-lg font-bold text-gray-800">
                    {getFullName(donor)}
                  </p>
                  <p className="text-xs text-gray-500">{donor.email}</p>
                </div>
              </div>

              <div className={`border-l-4 ${colors.borderAccent} pl-4 py-1`}>
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                  要送給
                </p>
                <div className="flex items-start gap-2">
                  <BookOpen
                    className={`w-5 h-5 ${colors.accentColor} mt-1 shrink-0`}
                  />
                  <div>
                    <p className="font-bold text-gray-900">
                      {getFullName(recipient)}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      {recipient.email}
                    </p>
                    <p className="text-sm text-gray-600">
                      贈送書籍：{donor.bookTitle}
                    </p>
                    <p className="text-sm text-gray-600">
                      作者：{donor.bookAuthors.join(", ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <div className="flex gap-2">
                  <Quote className="w-4 h-4 text-yellow-600 shrink-0" />
                  <p className="text-sm text-gray-700 italic">
                    &ldquo;{recipient.assignedReason}&rdquo;
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
