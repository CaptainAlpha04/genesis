"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { set } from "mongoose";

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

async function fetchChatHistory(userID: string, botName: string) {
    const response = await fetch(`http://localhost:8000/fetchChatHistory/${userID}/${botName}`);
    const data = await response.json();
    const chatHistory = await data.chatHistory
    return chatHistory

}

function Page() {
    const [bots, setBots] = useState([]);
    const [convoBot, setConvoBot] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<{ sender: string; text: string; }[]>([]);
    const [response, setResponse] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const { data: session, status } = useSession();
    const router = useRouter();

    const selectedBot = async (bot: string) => {
        setConvoBot(bot);
        setChatHistory(await fetchChatHistory(session?.user?.id ?? '', bot));
    }

    useEffect(() => {
        const fetchData = async () => {
            const data = await fetchBots();
            setBots(data);
        };
        fetchData();
    }, []);
    
    const messageEndRef = useRef(null);

    const scrollToBottom = () => {
        (messageEndRef.current as unknown as HTMLElement)?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, chatHistory]);

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
        const userMessage = {sender: "user", text: messageToSend};
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        const message = await conversation(messageToSend, convoBot, session?.user?.id ?? '', session?.user?.name ?? '');
        setResponse(message);
        const botMessage = {sender: "bot", text: message};
        setMessages((prevMessages) => [...prevMessages, botMessage]);
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
                        <button className={(convoBot === bot ? "btn btn-primary" : "btn btn-ghost")}
                        onClick={() => selectedBot(bot)}
                        >{bot}</button>
                    ))}
                    </div>
        
                </section>
                {/* Main Content */}
                <section className="w-3/4 h-screen">
                    <div className="w-full flex flex-col h-screen overflow-auto py-20 px-5 ">
                        {/* Chat History */}
                        {chatHistory.map((chat:any) => (
                            <>
                            {/* User Response */}
                            <div className="chat chat-end">
                            <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                <img
                                    alt="Tailwind CSS chat bubble component"
                                    src= {session?.user?.image ?? ''} />
                                </div>
                            </div>
                            <div className="chat-header">
                                {session?.user?.name ?? ''}
                            </div>
                            <div className="chat-bubble w-1/2 max-w-fit chat-bubble-secondary">{chat.user}</div>
                            </div>

                            {/* Bot Response */}
                            <div className="chat chat-start">
                            <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                <img
                                    alt="Tailwind CSS chat bubble component"
                                    src="profile.png" />
                                </div>
                            </div>
                            <div className="chat-header">
                                {convoBot}
                            </div>
                            <div className="chat-bubble w-1/2 max-w-fit">{chat.bot}</div>
                            </div>
                        </>
                        ))}
                        
                        {/* Current Chat */}
                        {/* User Response */}
                        {messages.map((message, index) => (
                            <div key={index} className={`chat ${message.sender === "user" ? "chat-end" : "chat-start"}`}>
                                <div className="chat-image avatar">
                                <div className="w-10 rounded-full">
                                    <img alt="avatar" src={message.sender === "user" ? session?.user?.image ?? "" : "profile.png"} />
                                </div>
                                </div>
                                <div className="chat-header">{message.sender === "user" ? session?.user?.name ?? "" : convoBot}</div>
                                <div className={`chat-bubble w-1/2 max-w-fit ${message.sender === "user" ? "chat-bubble-secondary" : ""}`}>
                                {message.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messageEndRef}></div>
                    </div>

                    {/* Input Section */}
                    <div className="w-3/4 flex flex-row items-center bottom-0 fixed gap-2 p-2 bg-base-100">
                        <i className="fi fi-rr-clip text-2xl btn btn-ghost"></i>
                        <i className="fi fi-rr-smile text-2xl btn btn-ghost"></i>
                        <input
                            type="text"
                            className="input input-md w-5/6 text-lg"
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
