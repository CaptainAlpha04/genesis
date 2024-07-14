"use client"
import React, { useEffect } from 'react'
import SideBar from './components/SideBar'
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

async function logOut(userId : string) {
    const response = await fetch(`http://localhost:8000/logOut/${userId}`)
    const data = await response.json()
    await signOut({ redirect: true, callbackUrl: "/login" });
}

function Page() {
    const { data: session, status } = useSession();
    const router = useRouter();
    
    useEffect(() => {
        if (status === "loading") {
            // Do nothing while loading
            return;
        }

        if (!session) {
            router.push("/login");
        } else {
            console.log("User ID:", session.user.id);
        }
    }, [router, session, status]);

return (
    <>
    <section className="h-screen flex flex-row font-poppins text-base-content">
    <SideBar currentPage='home'/>
    <button className="btn btn-primary" onClick={() => {logOut(session?.user.id ?? '')}}>
                            Sign Out
                        </button>
    
    </section>
    </>
)
}

export default Page
