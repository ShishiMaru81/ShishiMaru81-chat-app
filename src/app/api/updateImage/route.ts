import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { imageUrl } = await req.json();
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        connectToDatabase();
        await User.findOneAndUpdate({ email: session.user.email }, { profilePicture: imageUrl });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        console.error("Error updating image:", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });

    }
}