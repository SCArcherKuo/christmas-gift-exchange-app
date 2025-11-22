import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data.json");

export interface Participant {
    id: string;
    name: string;
    bookIsbn: string;
    bookTitle: string;
    bookAuthors: string[];
    wishlist: string;
    assignedBookId?: string; // ID of the book they receive
    assignedReason?: string;
}

export async function getParticipants(): Promise<Participant[]> {
    try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist, return empty array
        return [];
    }
}

export async function saveParticipant(participant: Participant) {
    const participants = await getParticipants();
    participants.push(participant);
    await fs.writeFile(DATA_FILE, JSON.stringify(participants, null, 2));
    return participant;
}

export async function saveAllParticipants(participants: Participant[]) {
    await fs.writeFile(DATA_FILE, JSON.stringify(participants, null, 2));
}
