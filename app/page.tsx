"use client";

import { useState } from "react";
import EntryForm from "@/components/EntryForm";
import ParticipantList from "@/components/ParticipantList";
import { Gift } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEntryAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-red-700 to-red-600 rounded-b-[50%] scale-x-110 -translate-y-10 shadow-lg z-0"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-md mb-4">
            <Gift className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 drop-shadow-md">
            Christmas Book Exchange
          </h1>
          <p className="text-red-100 text-lg font-medium">
            Share a story, receive a surprise!
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-8">
            <EntryForm onEntryAdded={handleEntryAdded} />
          </div>

          <div className="lg:col-span-7">
            <ParticipantList refreshTrigger={refreshTrigger} />

            <div className="mt-8 text-center">
              <Link
                href="/match"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-red-700 bg-white hover:bg-red-50 shadow-lg transition-all hover:scale-105"
              >
                Start Matching Event 🎄
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Snowflakes or decoration could go here */}
    </main>
  );
}
