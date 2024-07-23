"use client";
import React, { useEffect, useState } from 'react';
import SideBar from './components/SideBar';
import CustomCalender from "@/app/components/Calender";
import { useSession } from 'next-auth/react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { firestore } from '../firebaseconfig';
import StickyNote from './components/Notes';
import { Stick } from 'next/font/google';

function Page() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<string[]>([]);
    const [chatrooms, setChatrooms] = useState<string[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersCollection = collection(firestore, 'users');
                const usersQuery = query(usersCollection, limit(3)); // Fetch 3 users
                const querySnapshot = await getDocs(usersQuery);
                const fetchedUsers = querySnapshot.docs.map(doc => doc.data().name); // Adjust according to your user schema
                setUsers(fetchedUsers);
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        };

        const fetchChatrooms = async () => {
            try {
                const chatroomsCollection = collection(firestore, 'chatrooms');
                const chatroomsQuery = query(chatroomsCollection, limit(3)); // Fetch 3 chatrooms
                const querySnapshot = await getDocs(chatroomsQuery);
                const fetchedChatrooms = querySnapshot.docs.map(doc => doc.data().name); // Adjust according to your chatroom schema
                setChatrooms(fetchedChatrooms);
            } catch (error) {
                console.error("Error fetching chatrooms: ", error);
            }
        };

        fetchUsers();
        fetchChatrooms();
    }, []);

    return (
        <section className="h-screen flex flex-row font-poppins text-base-content">
            <SideBar currentPage='home' />
            <div className='flex flex-col flex-1 p-4 relative'>
                {/* GenesisVerse Header */}
                <div className='flex-1 flex justify-center'>
                    <h1 className='text-3xl font-bold'>THE GENESISVERSE</h1>
                </div>
                
                <div className='flex flex-col gap-4 mt-8'>
                    <div className='bg-slate-400 dark:bg-gray-800 w-fit rounded-xl p-4'>
                        <h2 className='text-2xl font-bold mb-2 text-black dark:text-white'>OUR TOP SAPIENS OF THE MONTH</h2>
                        <ul className='list-disc list-inside space-y-2 text-black dark:text-gray-200'>
                            {users.length > 0 ? users.map((user, index) => (
                                <li key={index} className='text-lg font-semibold'>{user}</li>
                            )) : <li className='text-lg font-semibold'>Loading...</li>}
                        </ul>
                    </div>
                    <div className='bg-slate-400 dark:bg-gray-800 w-fit rounded-xl p-4'>
                        <h2 className='text-2xl font-bold mb-2 text-black dark:text-white'>OUR TOP Cybernauts OF THE MONTH</h2>
                        <ul className='list-disc list-inside space-y-2 text-black dark:text-gray-200'>
                            {/* This section is static, you may adjust as needed */}
                            <li className='text-lg font-semibold'>Dan Brown - Cybersecurity Specialist</li>
                            <li className='text-lg font-semibold'>Eve White - Cryptography Expert</li>
                            <li className='text-lg font-semibold'>Frank Green - AI Ethics Advocate</li>
                        </ul>
                    </div>
                    <div className='bg-slate-400 dark:bg-gray-800 w-fit rounded-xl p-4'>
                        <h2 className='text-2xl font-bold mb-2 text-black dark:text-white'>OUR TOP Chatrooms OF THE MONTH</h2>
                        <ul className='list-disc list-inside space-y-2 text-black dark:text-gray-200'>
                            {chatrooms.length > 0 ? chatrooms.map((chatroom, index) => (
                                <li key={index} className='text-lg font-semibold'>{chatroom}</li>
                            )) : <li className='text-lg font-semibold'>Loading...</li>}
                        </ul>
                    </div>
                </div>
                
                {/* Calendar */}
                <div className='absolute top-28 right-6 flex flex-col'>
                    <CustomCalender />
                    <StickyNote />
                </div>
                
                
            </div>
        </section>
    );
}

export default Page;