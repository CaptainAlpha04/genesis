"use client"
import React from 'react'
import SideBar from './components/SideBar'


function Page() {
return (
    <>
    <section className="h-screen flex flex-row font-poppins text-base-content">
    <SideBar currentPage='home'/>
    </section>
    </>
)
}

export default Page
