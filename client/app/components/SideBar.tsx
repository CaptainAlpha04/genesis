"use client";
import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ThemeSwitch from "./ThemeSwitch";
import { doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { firestore } from "../../firebaseconfig";

function SideBar({ currentPage }: { currentPage: string }) {
    const { data: session, status } = useSession();
    const [selectedPage, setSelectedPage] = useState<string>(
        currentPage ?? "home"
    );
    const router = useRouter();
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [showProfileModal, setShowProfileModal] = useState<boolean>(false); // State to control modal display

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
    // Function to handle clicking on profile image
    const handleProfileClick = () => {
        // Check if the current page is the profile page
        if (currentPage === "profile") {
            // Show profile modal
            setShowProfileModal(true);
        } else {
            // Navigate to the profile page
            router.push("/profile");
        }
    };

    // Function to close profile modal
    const handleCloseProfileModal = () => {
        setShowProfileModal(false);
    };

    return (
        <>
            <section className="flex flex-col p-2 gap-1 pt-4">
                <div className="tooltip tooltip-right" data-tip="Account">
                    <img
                        src={profilePicture ?? "/profile.png"} // Default image if no profile picture
                        alt="User"
                        onClick={handleProfileClick} // Use the handler function
                        className="btn btn-circle cursor-pointer"
                    />
                </div>

                <ThemeSwitch />

                <div className="divider"></div>

                <div className="tooltip tooltip-right" data-tip="Home">
                    <button
                        onClick={() => router.push("/")}
                        className={`btn btn-square  ${
                            currentPage === "home"
                                ? " btn-primary"
                                : " btn-ghost"
                        }`}
                    >
                        <i className="fi fi-br-home text-lg"></i>
                    </button>
                </div>

                <div className="tooltip tooltip-right" data-tip="Marketplace">
                    <button
                        onClick={() => router.push("/marketplace")}
                        className={`btn btn-square  ${
                            currentPage === "marketplace"
                                ? " btn-primary"
                                : " btn-ghost"
                        }`}
                    >
                        <i className="fi fi-br-shop text-lg"></i>
                    </button>
                </div>

                <div className="tooltip tooltip-right" data-tip="Sapiens">
                    <button
                        onClick={() => router.push("/sapiens")}
                        className={`btn btn-square  ${
                            currentPage === "sapiens"
                                ? " btn-primary"
                                : " btn-ghost"
                        }`}
                    >
                        <i className="fi fi-br-dna text-lg"></i>
                    </button>
                </div>

                <div className="tooltip tooltip-right" data-tip="Cybernauts">
                    <button
                        onClick={() => router.push("/cybernauts")}
                        className={`btn btn-square  ${
                            currentPage === "cybernauts"
                                ? " btn-primary"
                                : " btn-ghost"
                        }`}
                    >
                        <i className="fi fi-br-chart-network text-lg"></i>
                    </button>
                </div>

                <div className="tooltip tooltip-right" data-tip="Rooms">
                    <button
                        onClick={() => router.push("/rooms")}
                        className={`btn btn-square  ${
                            currentPage === "rooms"
                                ? " btn-primary"
                                : " btn-ghost"
                        }`}
                    >
                        <i className="fi fi-br-users text-lg"></i>
                    </button>
                </div>

                <div className="tooltip tooltip-right" data-tip="Notifications">
                    <button
                        onClick={() => router.push("/notifications")}
                        className={`btn btn-square  ${
                            currentPage === "notifications"
                                ? " btn-primary"
                                : " btn-ghost"
                        }`}
                    >
                        <i className="fi fi-br-bell text-lg"></i>
                    </button>
                </div>
            </section>
            {/* Profile Modal */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-filter backdrop-blur-sm">
                    <div className="relative w-3/4 max-w-md p-4 bg-white rounded-lg shadow-lg">
                        <img
                            src={profilePicture ?? "/profile.png"} // Default image if no profile picture
                            alt="User"
                            className="rounded-full w-48 h-48 object-cover object-center mx-auto"
                        />
                        <button
                            onClick={handleCloseProfileModal}
                            className="absolute top-0 right-0 m-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none"
                        >
                            <i className="fi fi-br-cross text-lg"></i>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default SideBar;
