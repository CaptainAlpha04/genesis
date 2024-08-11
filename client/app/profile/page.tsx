"use client"
import React, { useEffect, useState } from 'react';
import SideBar from '../components/SideBar';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { firestore } from '../../firebaseconfig' // Import your Firebase setup
import { doc, updateDoc } from 'firebase/firestore';

async function logOut(userId: string) {
    try {
        const response = await fetch(`http://localhost:8000/logOut/${userId}`);
        const data = await response.json();
        if (response.ok) {
            await signOut({ redirect: false }); // Do not redirect immediately
            window.location.href = "/login"; // Manually redirect after sign out
        } else {
            console.error("Logout failed:", data);
        }
    } catch (error) {
        console.error("Error logging out:", error);
    }
}

async function generateProfilePicture(prompt: string) {
    try {
        const response = await fetch('http://localhost:8000/generateUserImage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });
        const data = await response.json();
        if (response.ok) {
            return data.image;
        } else {
            console.error("Image generation failed:", data);
        }
    } catch (error) {
        console.error("Error generating image:", error);
    }
}

async function updateFirestoreProfilePicture(userId: string, imageUrl: string) {
    try {
        const userDocRef = doc(firestore, 'users', userId);
        await updateDoc(userDocRef, {
            profilePicture: imageUrl,
        });
    } catch (error) {
        console.error("Error updating Firestore profile picture:", error);
    }
}

function Page() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [prompt, setPrompt] = useState('');
    const [updating, setUpdating] = useState(false); // State to manage updating state

    useEffect(() => {
        if (status === "loading") {
            // Do nothing while loading
            return;
        }

        if (!session) {
            router.push("/login");
        } else {
            console.log("User ID:", session?.user?.id);
        }
    }, [router, session, status]);

    const handleUpdateProfilePicture = async () => {
        try {
            setUpdating(true); // Start updating state
            const generatedImage = await generateProfilePicture(prompt);
            if (generatedImage) {
                await updateFirestoreProfilePicture(session?.user.id ?? '', generatedImage);
                // Show success message in a dialog box
                alert("Profile picture updated successfully!"); // You can replace this with a dialog component
            }
        } catch (error) {
            console.error("Error updating profile picture:", error);
        } finally {
            setUpdating(false); // Reset updating state
        }
    };

    return (
        <>
        <section className="h-screen flex flex-row font-poppins text-base-content">
            <SideBar currentPage='profile' />
            <section className="flex flex-col items-center justify-center w-full">
                <button className="btn btn-primary" onClick={() => logOut(session?.user.id ?? '')}>
                    Sign Out
                </button>
                <div className="flex flex-col items-center mt-4">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe your new profile picture"
                        className="input input-bordered w-full max-w-xs mb-2"
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={handleUpdateProfilePicture}
                        disabled={updating} // Disable button while updating
                    >
                        {updating ? (
                            <div className="flex items-center space-x-2">
                                <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2.5A1.5 1.5 0 0113.5 1h-3A1.5 1.5 0 019 2.5V4a8 8 0 014 6.93V11h-1.5a1.5 1.5 0 010-3H18v-.07A10 10 0 004 12z"></path>
                                </svg>
                                <span>Updating...</span>
                            </div>
                        ) : (
                            <span>Update PFP</span>
                        )}
                    </button>
                </div>
            </section>
        </section>
    </>
    );
}

export default Page;
