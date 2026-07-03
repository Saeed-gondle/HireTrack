// components/LogoutButton.tsx
"use client";

import { signOut } from "next-auth/react";
import { HiCog6Tooth } from "react-icons/hi2";

export default function LogoutButton() {
    return (
        <button
            onClick={() => signOut()}
            className="flex items-center gap-2 cursor-pointer"
        >
            <HiCog6Tooth /> Logout
        </button>
    );
}