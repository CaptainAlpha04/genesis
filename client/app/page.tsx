"use client";
import React, { useEffect, useState } from 'react';
import SideBar from './components/SideBar';
import CustomCalender from "@/app/components/Calender";
import { firestore } from '../firebaseconfig';
import { useSession } from 'next-auth/react';
import { collection, query, orderBy, where, onSnapshot, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import StickyNote from './components/Notes';

async function fetchBots(userId: string) {
    try {
        const response = await fetch(`http://localhost:8000/fetchBots/${userId}`);
        const data = await response.json();
        return data.bots;
    } catch (error) {
        console.error("Error fetching bots", error);
    }
}


async function fetchAssistantBot(userId: string) {
    try {
        const response = await fetch(`http://localhost:8000/fetchAssistantBot/${userId}`);
        const data = await response.json();
        return data.bot;
    } catch (error) {
        console.error("Error fetching assistant bot", error);
    }

}

function Page() {
    const { data: session } = useSession();
    const [time, setTime] = useState<string>();
    const [users, setUsers] = useState<any[]>([]);
    const [chatrooms, setChatrooms] = useState<any[]>([]);
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [bots, setBots] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            const date = new Date();
            // set time without seconds
            const timeWithoutSeconds = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setTime(timeWithoutSeconds);
        }, 1000);

        return () => clearInterval(interval);
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const botData = await fetchBots(session?.user.id ?? "");
            if (session?.user?.id) {
                const assistantBot = await fetchAssistantBot(session.user.id);
                if (assistantBot) {
                    const data: any = [...botData, assistantBot];
                    setBots(data);
                } else {
                    setBots(botData);
                }
            } else {
                setBots(botData);
            }
        };
        if (session) {
            fetchData();
        }
    }, [session]);

    const sortedBots = bots.sort((a: any, b: any) => b.relationship - a.relationship);


    useEffect(() => {
        if (session) {
            const fetchUsers = async () => {
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Filter out the current user
            const filteredUsers = usersList.filter(user => user.email !== session.user.email);
            setUsers(filteredUsers);
            };
    
            fetchUsers();
        }
        }, [session]);
        useEffect(() => {
        const fetchUserProfile = async () => {
            if (session) {
                const userRef = doc(firestore, "users", session.user.id);
                const userSnapshot = await getDoc(userRef);
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    setProfilePicture(userData.profilePicture ?? null);
                }
            }
        };
        fetchUserProfile();
    }, [session]);

    useEffect(() => {
        if (session) {
        const fetchChatrooms = async () => {
            const chatroomsSnapshot = await getDocs(collection(firestore, 'chatrooms'));
            const chatroomsList = chatroomsSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data(), members: doc.data().members }))
                .filter(chatroom => chatroom.members.includes(session.user.email));
            setChatrooms(chatroomsList);
        };
    
        const fetchUsers = async () => {
            const usersSnapshot = await getDocs(collection(firestore, 'users'));
            const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersList.filter(user => user.email !== session.user.email));
        };
    
        fetchChatrooms();
        fetchUsers();
        }
    }, [session]);
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (session) {
                const userRef = doc(firestore, "users", session.user.id);
                const userSnapshot = await getDoc(userRef);
                if (userSnapshot.exists()) {
                    const userData = userSnapshot.data();
                    setProfilePicture(userData.profilePicture ?? null);
                }
            }
        };
        fetchUserProfile();
    }, [session]);
    
    
    return (
        <section className="h-screen flex flex-row font-poppins text-base-content">
            <SideBar currentPage='home' />
            <div className='flex flex-col flex-1 p-4 relative bg-gradient-to-r from-base-100 to-primary'>
                {/* Genesis Header */}
                <div className='flex-1 flex justify-start gap-2'>
                    <h1 className='text-3xl font-bold'>Genesis</h1>
                    <p className='text-3xl font-light'>Dashboard</p>
                </div>

                <div className='hero hero-content justify-end text-white'>
                    <div>
                    <h1 className='text-7xl font-poppins font-thin'>{time}</h1>  
                    <p className='text-md font-light'>Welcome Back! {session?.user.name}</p>
                    </div>
                </div>
                <div className='flex justify-center m-4 w-full'>
                </div>                

                <div className='grid grid-cols-2 gap-4 bg-base-300 p-10 w-full justify-center rounded-lg'>
                <div className="flex flex-col gap-1 bg-base-200 rounded-xl">
                    <h1 className="text-balance font-bold text-xl p-3">Recent Sapiens</h1>
                    {users.slice(0,3).map((user) => (
                        user.id !== session?.user?.id && (
                            <div
                            key={user.id}
                            className={`p-3 flex flex-row align-middle cursor-pointer hover:bg-base-100 text-base-content rounded-xl`}
                            >
                            <div className="flex flex-row gap-1">
                            <img src={user.profilePicture ?? "profile.png"} alt="User Avatar" className="w-10 h-10 rounded-full mr-2" />
                            <div>
                                <h1 className="font-medium">{user.name}</h1>
                                <p className='font-light text-xs'>{user.email}</p>
                            </div>
                            </div>
                        </div>
                        )
                    ))}
                    </div>

                    <div className="flex flex-col gap-1 bg-base-200 rounded-xl h-fit">
                        <h1 className="text-balance font-bold text-xl p-3">
                            Recent Cybernauts
                        </h1>
                        {sortedBots.slice(0,3).map((bot: any) => (
                            <div
                            key={bot.name}
                            className={"p-3 flex flex-row cursor-pointer hover:bg-base-100 text-base-content rounded-xl"}
                            >
                                <img
                                    src={bot.DP || "profile.png"}
                                    alt="Bot Avatar"
                                    className="w-10 h-10 rounded-full mr-2"
                                />
                                <div className="flex flex-col w-full">
                                    <h1 className="font-medium">{bot.name}</h1>
                                    <p className="font-light text-xs">
                                        {bot.profession}
                                    </p>
                                </div>
                                <div className="tooltip" data-tip="Relationship status">
                                    <span className="indicator-item badge badge-secondary">{bot.relationship}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="p-3 flex flex-col gap-1 justify-between bg-base-200 rounded-2xl">
                        <h1 className="text-xl font-bold">Recent Chatrooms</h1>
                    <div className="flex flex-col gap-2">
                        {chatrooms.slice(0, 3).map((chatroom) => (
                            <div
                            key={chatroom.id}
                            className={`p-4 rounded-xl cursor-pointer transition-colors duration-300 ease-in-out hover:bg-base-100`}
                            >
                            <h1 className="text-lg font-semibold">{chatroom.name}</h1>
                            <p className="text-sm text-gray-600">Created by {chatroom.createdBy}</p>
                        </div>
                        ))}
                    </div>
                </div>
                    <StickyNote />
                </div>
                
                
                
            </div>
        </section>
    );
}

export default Page;