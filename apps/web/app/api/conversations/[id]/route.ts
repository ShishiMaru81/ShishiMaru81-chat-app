import { Conversation } from "@/models/Conversation";
import { connectToDatabase } from "@/lib/Db/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectToDatabase();
    const { id } = await params;
    const convo = await Conversation.findById(id)
        .populate("participants", "username email profilePicture");
    if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(convo);
}
