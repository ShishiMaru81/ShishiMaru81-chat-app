// components/UserAvatar.tsx
"use client";

import { useSession } from "next-auth/react";
//import Image from "next/image";

const UserAvatar = () => {
    const { data: session, status } = useSession();

    if (status === "loading") return null;
    if (!session?.user) return null;

    return (
        <div className="flex items-center gap-2">
            <img
                src={session.user.image}
                alt={session.user.name}
                className="w-10 h-10 rounded-full"
            />
        </div>
    );
};

export default UserAvatar;
