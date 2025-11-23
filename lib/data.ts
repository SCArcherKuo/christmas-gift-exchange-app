"use client";

export interface Participant {
  id: string;
  name: string;
  bookIsbn: string;
  bookTitle: string;
  bookAuthors: string[];
  wishlist: string;
  assignedBookId?: string;
  assignedReason?: string;
}

const STORAGE_KEY = "gift-exchange-participants";
const API_URL = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;
console.log("Google Script URL Configured:", !!API_URL, API_URL ? API_URL.substring(0, 10) + "..." : "N/A");

export async function getParticipants(): Promise<Participant[]> {
  // If API URL is set, fetch from Google Sheets
  if (API_URL) {
    try {
      const res = await fetch(API_URL);
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (error) {
      console.error("Failed to fetch from Google Sheets", error);
    }
  } else {
    console.warn("Google Sheets API URL is not configured. Falling back to LocalStorage. Check your .env.local or GitHub Secrets.");
  }

  // Fallback to LocalStorage
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse participants", e);
    return [];
  }
}

export async function saveParticipant(participant: Participant): Promise<Participant> {
  if (API_URL) {
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors", // Google Apps Script Web App often requires no-cors for simple POSTs
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(participant),
      });
      // We can't read the response in no-cors mode, so we assume success
      // But we should also update local cache/state if needed, 
      // though the app refetches on update usually.
    } catch (error) {
      console.error("Failed to save to Google Sheets", error);
    }
  }

  // Always save to LocalStorage as backup/cache
  const participants = await getParticipants();
  // Check if already exists to avoid duplicates in local (though API might handle it differently)
  if (!participants.find(p => p.id === participant.id)) {
    participants.push(participant);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
    }
  }

  return participant;
}

export async function saveAllParticipants(participants: Participant[]) {
  if (API_URL) {
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(participants),
      });
    } catch (error) {
      console.error("Failed to save all to Google Sheets", error);
    }
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  }
}
