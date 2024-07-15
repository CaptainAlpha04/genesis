"use client"
import React from 'react'
import SideBar from './components/SideBar'

function Page() {
return (
    <>
    <section className="h-screen flex flex-row font-poppins text-base-content">
    <SideBar currentPage='' />
    <div className='hero-content hero ml-10 flex flex-col'>
            <h2 className='text-5xl font-bold'>404</h2>
            <p>Page not Found</p>
    </div>
    </section>
    </>
)
}

export default Page
