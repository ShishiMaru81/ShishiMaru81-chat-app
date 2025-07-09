// src/app/api/messages/route.ts
import { connectToDatabase } from "@/lib/db";
import Message from "@/models/Message";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    await connectToDatabase();
    const { sender, content } = await req.json();

    if (!sender || !content) {
        return NextResponse.json({ success: false, error: "Missing sender or content" }, { status: 400 });
    }

    try {
        const message = await Message.create({ sender, content });
        return NextResponse.json({ success: true, message });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function GET() {
    await connectToDatabase();
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    return NextResponse.json({ success: true, messages });
}
