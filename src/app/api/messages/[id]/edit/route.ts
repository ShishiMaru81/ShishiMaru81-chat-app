import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Message from "@/models/Message";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const { newText } = await req.json();

    const message = await Message.findById(params.id);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.sender.toString() !== session.user.email) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    message.text = newText;
    message.isEdited = true;
    await message.save();

    // Optionally emit Socket.IO event
    //io.to(message.conversation.toString()).emit("message:edited", message);

    return NextResponse.json({ success: true, message });
}