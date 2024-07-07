"use client";
import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

async function fetchBots() {
    const response = await fetch("http://localhost:8000/fetchBots");
    const data = await response.json();
    const bots = await data.bots
    return bots
}

async function conversation(message: string, botName: string, userId: string, userName: string) {
    
    const payload = {userName, botName, message}
    const response = await fetch(`http://localhost:8000/conversation/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    const answer = await data.answer
    return answer;
}

function Page() {
    const [bots, setBots] = useState([]);
    const [convoBot, setConvoBot] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [response, setResponse] = useState("");
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchBots();
            setBots(data);
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (status === "loading") {
            // Do nothing while loading
            return;
        }

        if (!session) {
            router.push("/login");
        }else {
            console.log("User ID:", session.user.id);
        }
    }, [router, session, status]);

    const handleInputChange = (event: any) => {
        setInputValue((event.target as HTMLInputElement).value);
    };

    const handleChatClick = () => {
        router.push("/chat");
    };
    const handleSubmit = async (): Promise<void> => {
        const messageToSend = inputValue;
        setInputValue("");
        const message = await conversation(messageToSend, convoBot, session?.user?.id ?? '', session?.user?.name ?? '');
        setResponse(message);
    };

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="border-t-4 border-gray-500 rounded-full animate-spin h-14 w-14"></div>
            </div>
        );
        // Or a spinner/loading component
    }

    return (
        <>
            {/* Top Level Screen View */}
            <section className="h-screen flex flex-row">
                {/* Side Bar */}
                <section className="w-1/4 h-screen bg-base-200">
                    {/* Sign Out Button */}
                    <button
                        onClick={() => signOut()}
                        className="btn btn-danger m-4"
                    >
                        Sign Out
                    </button>
                    <button
                        className="btn btn-primary m-4"
                        onClick={handleChatClick}
                    >
                        Chat
                    </button>

                    {/* Bot List */}
                    <div className='flex flex-col gap-1'>
                        <h1>Cybernauts</h1>
                    {bots.map((bot : string) => (
                        <button className='btn btn-ghost'
                        onClick={() => setConvoBot(bot)}
                        >{bot}</button>
                    ))}
                    </div>
          
                </section>
                {/* Main Content */}
                <section className="w-3/4 h-screen">
                    <div className="w-full flex flex-col">
                        <p className="p-10 text-lg">{response}</p>
                    </div>

                    {/* Input Section */}
                    <div className="w-full flex flex-row items-center bottom-0 absolute my-5 gap-2 p-1">
                        <i className="fi fi-rr-clip text-2xl btn btn-ghost"></i>
                        <i className="fi fi-rr-smile text-2xl btn btn-ghost"></i>
                        <input
                            type="text"
                            className="input input-md w-3/5 text-lg"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                e.key === "Enter" && handleSubmit();
                            }}
                            placeholder="Enter your message"
                        />
                        <button
                            onClick={handleSubmit}
                            className="btn btn-primary"
                        >
                            <i className="fi fi-rr-paper-plane-top font-bold"></i>
                        </button>
                    </div>
                </section>
            </section>
        </>
    );
}

export default Page;
