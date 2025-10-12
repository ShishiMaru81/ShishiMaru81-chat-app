import { connectToDatabase } from "@/lib/db";
import Otp from "@/models/OTP";
import { sendOtpEmail } from "@/lib/sendOtp";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { email } = await req.json();
        // Generate a random 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry
        // Delete any old OTP for this email
        await Otp.deleteMany({ email });
        // Create a new OTP
        const hashedOtp = await bcrypt.hash(otp, 10);
        await Otp.create({ email: email, otp: hashedOtp, createdAt: expiresAt });
        // Send the OTP via email
        await sendOtpEmail(email, otp);

        return NextResponse.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
        console.error("Send OTP error:", error);
        return NextResponse.json({ success: false, message: "Failed to send OTP", status: 500 });
    }
}