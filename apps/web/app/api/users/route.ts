// /pages/api/users.ts
import { connectToDatabase } from "@/lib/Db/db";
import { User } from "@/models/User";
import { getAuthUser } from "@/lib/utils/auth/getAuthUser";



export async function GET() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
    }

    await connectToDatabase();

    const users = await User.find({ email: { $ne: authUser.email } }).select("-password");
    return new Response(JSON.stringify(users), { status: 200 });
}
