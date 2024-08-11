"use client";
import React from "react";
import SideBar from "../components/SideBar";

function Page() {
    return (
        <>
            <section className="h-screen flex flex-row font-poppins text-base-content">
                <SideBar currentPage="notifications" />
                <div className="flex-grow flex items-center justify-center">
                    <h1 className="text-4xl font-bold">Coming Soon</h1>
                </div>
            </section>
        </>
    );
}

export default Page;
