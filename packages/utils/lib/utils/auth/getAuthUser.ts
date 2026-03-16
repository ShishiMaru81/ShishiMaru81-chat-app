import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export const getAuthUser = async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
        return null;
    }
    return {
        id: session.user.id as string,
        email: session.user.email!,
        role: session.user.role!,
        image: session.user.image ?? null,
    };
};