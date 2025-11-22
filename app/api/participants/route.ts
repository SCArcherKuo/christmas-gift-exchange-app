import { getParticipants, saveParticipant } from "@/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
    const participants = await getParticipants();
    return NextResponse.json(participants);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Basic validation
        if (!body.name || !body.id || !body.bookIsbn) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const newParticipant = await saveParticipant(body);
        return NextResponse.json(newParticipant, { status: 201 });
    } catch (error) {
        console.error("Error saving participant:", error);
        return NextResponse.json(
            { error: "Failed to save participant" },
            { status: 500 }
        );
    }
}
