"use client"
import React from 'react'
import SideBar from './components/SideBar'

function Page() {
return (
    <>
    <section className="h-screen flex flex-row font-poppins text-base-content">
    <SideBar currentPage='' />
    <div className='hero hero-content'>
            <h2 className='text-2xl font-bold'>Loading...</h2>
            <span className="loading loading-dots loading-lg"></span> 
    </div>
    </section>
    </>
)
}

export default Page
