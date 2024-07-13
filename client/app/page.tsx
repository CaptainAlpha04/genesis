"use client"
import React, { useEffect } from 'react'
import SideBar from './components/SideBar'
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    <button className="btn btn-primary" onClick={() => signOut()}>
                            Sign Out
                        </button>
    
    </section>
    </>
)
}

export default Page
