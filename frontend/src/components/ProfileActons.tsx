import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import { HiCog6Tooth } from "react-icons/hi2";
import LogoutButton from "./LogoutButton";


async function ProfileActons() {
    const session = await auth();
    return (
        <div className="flex flex-col gap-4 items-center justify-center w-full">
            {session?.user?.role == "ADMIN" ?
                <div className="flex flex-col gap-2 items-start justify-start w-full">
                    <Link href="/recruiter/dashboard" className="btn account-action w-full">Post Job</Link>
                    <Link href="/user/dashboard" className="btn account-action w-full">Upload Resume</Link>
                </div>
                : session?.user?.role == "RECRUITER" ?
                    <Link href="/recruiter/dashboard" className="btn account-action w-full">Post Job</Link>
                    : session?.user.role == "CANDIDATE" ? <Link href="/user/dashboard" className="btn account-action w-full">Upload Resume</Link> : null
            }
            <div className="flex flex-col gap-2 justify-start w-full">
                <Link href="/support" className="flex items-center gap-2"><HiCog6Tooth /> Support</Link>
                <LogoutButton />
            </div>
        </div>
    )
}

export default ProfileActons
