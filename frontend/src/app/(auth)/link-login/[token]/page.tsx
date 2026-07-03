"use client"
import { useParams, useRouter } from "next/navigation"
import axios from "axios"
import { useEffect, useState } from "react"
import { signIn } from "@/lib/auth"
import { toast } from "sonner"


async function page({ params }) {
    const token = await params;
    const router = useRouter()

    useEffect(async () => {
        try {
            await signIn("credentials", {
                token
            })

        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data.message)
            }
            else
                toast(`Failed to verify magic link ${err}`)
        }
    }, [token])
    return (
        <div>
            <div></div>
        </div>
    )
}

export default page
