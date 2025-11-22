import { getParticipants, saveAllParticipants, Participant } from "@/lib/data";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { apiKey } = await request.json();

        // Use provided key or env var
        const key = apiKey || process.env.GOOGLE_API_KEY;

        if (!key) {
            return NextResponse.json(
                { error: "API Key is required" },
                { status: 401 }
            );
        }

        const participants = await getParticipants();

        if (participants.length < 2) {
            return NextResponse.json(
                { error: "Need at least 2 participants to match." },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are a Secret Santa matching engine.
      I have a list of participants, each brought a book and has a wishlist.
      
      Rules:
      1. Each participant must receive exactly one book.
      2. A participant CANNOT receive the book they brought.
      3. Try to match the book to the participant's wishlist as best as possible.
      4. Provide a fun, Christmas-themed reason for the match.
      
      Participants:
      ${JSON.stringify(participants.map(p => ({
            id: p.id,
            name: p.name,
            broughtBookId: p.id, // Using participant ID as book ID for simplicity since 1 person = 1 book
            broughtBookTitle: p.bookTitle,
            broughtBookAuthors: p.bookAuthors,
            wishlist: p.wishlist
        })), null, 2)}

      Output must be a valid JSON array of objects with the following structure:
      [
        {
          "recipientId": "participant_id",
          "assignedBookFromId": "donor_participant_id",
          "reason": "Reason for this match..."
        }
      ]
      Do not include markdown formatting like \`\`\`json. Just the raw JSON.
    `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

        let matches;
        try {
            matches = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse AI response", responseText);
            return NextResponse.json({ error: "AI returned invalid format" }, { status: 500 });
        }

        // Update participants with match data
        const updatedParticipants = participants.map(p => {
            const match = matches.find((m: any) => m.recipientId === p.id);
            if (match) {
                return {
                    ...p,
                    assignedBookId: match.assignedBookFromId,
                    assignedReason: match.reason
                };
            }
            return p;
        });

        await saveAllParticipants(updatedParticipants);

        return NextResponse.json({ success: true, matches: updatedParticipants });

    } catch (error) {
        console.error("Matching error:", error);
        return NextResponse.json(
            { error: "Failed to perform matching" },
            { status: 500 }
        );
    }
}
