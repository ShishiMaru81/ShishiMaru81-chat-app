// /pages/api/me.ts
import { connectToDatabase } from "@/lib/Db/db";
import { User } from "@/models/User";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/utils/auth/getAuthUser";
import mongoose from "mongoose";


export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const userById = mongoose.Types.ObjectId.isValid(authUser.id)
        ? await User.findById(authUser.id).select("-password -isVerified -twoFactorEnabled")
        : null;
    const user = userById || (await User.findOne({ email: authUser.email }).select("-password -isVerified -twoFactorEnabled"));

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
}
