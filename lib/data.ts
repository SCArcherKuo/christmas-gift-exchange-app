"use client";

export interface Participant {
  id: string;
  name: string;
  bookIsbn: string;
  bookTitle: string;
  bookAuthors: string[];
  bookDescription: string;
  wishlist: string;
  assignedBookId?: string;
  assignedReason?: string;
}

const STORAGE_KEY = "gift-exchange-participants";

export function getParticipants(): Participant[] {
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

export function saveParticipant(participant: Participant): Participant {
  const participants = getParticipants();
  participants.push(participant);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  }

  return participant;
}

export function saveAllParticipants(participants: Participant[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
  }
}

export function deleteParticipant(id: string) {
  const participants = getParticipants();
  const filtered = participants.filter(p => p.id !== id);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  return filtered;
}

export function clearAllParticipants() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
