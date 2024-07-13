import React, {useState, useEffect} from 'react'
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ThemeSwitch from "./ThemeSwitch";
import {
    addDoc,
    arrayUnion,
    collection,
    doc,
    DocumentData,
    FieldValue,
    getDoc,
    getDocs,
    getFirestore,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from "@firebase/firestore";
import { firestore } from "../../firebaseconfig";

function SideBar({currentPage}: {currentPage: string}) {

const { data: session, status } = useSession();
const [selectedPage, setSelectedPage] = useState<string>(currentPage ?? "home");
const router = useRouter();

useEffect(() => {
    const addUserToFirestore = async () => {
        if (session) {
            const userRef = doc(firestore, "users", session.user.id);
            await setDoc(userRef, {
                name: session.user.name,
                email: session.user.email,
                id: session.user.id,
            }, { merge: true });
        }
    };
    addUserToFirestore();
}, [session]);



return (
    <>
        <section className="flex flex-col p-2 gap-1 pt-4">
        <div className="tooltip tooltip-right" data-tip = "Account">
            <img src={session?.user.image?? 'profile.png'} alt="User"  
            onClick={() => router.push("/profile")}
            className="btn btn-circle cursor-pointer"/>
        </div>

        <ThemeSwitch />

        <div className="divider"></div>


        <div className="tooltip tooltip-right" data-tip = "Home">
            <button onClick={() => router.push("/")}
            className={`btn btn-square  ${currentPage === 'home'? " btn-primary": " btn-ghost"}`}>
            <i className="fi fi-br-home text-lg"></i>
            </button>
        </div>

        <div className="tooltip tooltip-right" data-tip = "Marketplace">
            <button onClick={() => router.push("/marketplace")}
            className={`btn btn-square  ${currentPage === 'marketplace'? " btn-primary": " btn-ghost"}`}>
            <i className="fi fi-br-shop text-lg"></i>
            </button>
        </div>

        <div className="tooltip tooltip-right" data-tip = "Sapiens">
            <button onClick={() => router.push("/sapiens")}
            className={`btn btn-square  ${currentPage === 'sapiens'? " btn-primary": " btn-ghost"}`}>
            <i className="fi fi-br-dna text-lg"></i>
            </button>
        </div>


        <div className="tooltip tooltip-right" data-tip = "Cybernauts">
            <button onClick={() => router.push("/cybernauts")}
            className={`btn btn-square  ${currentPage === 'cybernauts'? " btn-primary": " btn-ghost"}`}>
            <i className="fi fi-br-chart-network text-lg"></i>
            </button>
        </div>

        <div className="tooltip tooltip-right" data-tip = "Rooms">
            <button onClick={() => router.push("/rooms")}
            className={`btn btn-square  ${currentPage === 'rooms'? " btn-primary": " btn-ghost"}`}>
            <i className="fi fi-br-users text-lg"></i>
            </button>
        </div>

        <div className="tooltip tooltip-right" data-tip = "Notifications">
            <button onClick={() => router.push("/notifications")}
            className={`btn btn-square  ${currentPage === 'notifications'? " btn-primary": " btn-ghost"}`}>
            <i className="fi fi-br-bell text-lg"></i>
            </button>
        </div>

        </section>

    </>
)
}

export default SideBar
