import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get("isbn");

    if (!isbn) {
        return NextResponse.json({ error: "ISBN is required" }, { status: 400 });
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        );
        const data = await response.json();

        if (data.totalItems === 0 || !data.items) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        const book = data.items[0].volumeInfo;
        return NextResponse.json({
            title: book.title,
            authors: book.authors || [],
            description: book.description || "",
            thumbnail: book.imageLinks?.thumbnail || "",
        });
    } catch (error) {
        console.error("Error fetching book:", error);
        return NextResponse.json(
            { error: "Failed to fetch book details" },
            { status: 500 }
        );
    }
}
