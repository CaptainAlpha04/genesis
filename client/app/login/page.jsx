"use client";
import React from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

const Page = () => {
  return (
    <div className='relative h-full w-full bg-gradient-to-r from-gray-200 to-cyan-200'>
      <div className='flex flex-col items-center relative text-4xl min-h-screen'>
        <h1 className='text-5xl relative top-10 bg-gradient-to-r from-neutral-600 to-cyan-600 inline-block text-transparent bg-clip-text animate-bounce'>
          LOGIN TO OUR APP
        </h1>
        <div className="flex items-center justify-center h-screen">
          <div className="backdrop-blur-md bg-white/30 p-10 rounded-lg shadow-lg animate-fade-in">
            <button onClick={() => signIn("google", { callbackUrl: '/' })} className="backdrop-blur-md bg-white/30 px-4 py-2 border flex items-center gap-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150">
              <img className="w-8 h-8 sm:w-14 sm:h-14" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
              <span className="text-slate-700 dark:text-slate-500">Login with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
