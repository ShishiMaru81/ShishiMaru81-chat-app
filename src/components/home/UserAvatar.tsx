// components/UserAvatar.tsx
"use client";

import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
//import Image from "next/image";

const UserAvatar = () => {
    const { data: session, status } = useSession();

    if (status === "loading") return null;
    if (!session?.user) return null;

    return (
        <div className="flex items-center gap-2">
            {session.user.image ? <Image
                src={session.user.image}
                alt={session.user.name || "User Avatar"}
                width={48}
                height={48}
                className="rounded-full"
            /> : <User size={48} />}
        </div>
    );
};

export default UserAvatar;
