"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

async function fetchBots() {
    try {
        const response = await fetch("http://localhost:8000/fetchBots");
        const data = await response.json();
        console.log(data.bots.DP)
        return data.bots;    
    } catch (error) {
        console.error("Error fetching bots", error);
    }
}

async function botAvailability(botName: string, userId: string) {
    const response = await fetch(`http://localhost:8000/checkBotAvailability/${userId}/${botName}`);
    const data = await response.json();
    return data.available;
}

async function conversation(message: string, botName: string, userId: string, userName: string) {
    const payload = { userName, botName, message };
    const response = await fetch(`http://localhost:8000/conversation/${userId}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.response;
}

async function fetchChatHistory(userID: string, botName: string) {
    const response = await fetch(`http://localhost:8000/fetchChatHistory/${userID}/${botName}`);
    const data = await   response.json();
    return data.chatHistory;
}

async function endConversation(userID: string, botName: string) {
    const response = await fetch(`http://localhost:8000/endConversation/${userID}/${botName}`);
    const data = await response.json();
    return data;
}

function Page() {
    const [bots, setBots] = useState([]);
    const [convoBot, setConvoBot] = useState<any>("");
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<{ sender: string; text: string; }[]>([]);
    const [response, setResponse] = useState("");
    const [botStatus, setBotStatus] = useState("");
    const [chatHistory, setChatHistory] = useState([]);
    const { data: session, status } = useSession();
    const router = useRouter();

    const selectedBot = async (bot: any) => {
        if (convoBot !== '') {
            endConversation(session?.user?.id ?? "", convoBot.name);
        }
        setConvoBot(bot);

        const botAvailable = await botAvailability(bot.name, session?.user?.id ?? '');
        if (botAvailable) {
            setBotStatus("Online");
        } else {
            setBotStatus("Offline");
        }

        const chatHistory = await fetchChatHistory(session?.user?.id ?? "", bot.name);
        const formattedChatHistory = chatHistory.flatMap((chat: any) => [
            { sender: "user", text: chat.user },
            { sender: bot.name, text: chat.bot },
        ]);
        setMessages(formattedChatHistory);
        
    };

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
        } else {
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
        const btn = document.getElementById("submitBtn") as HTMLButtonElement;
        const inputField = document.getElementById("input-field") as HTMLInputElement;
        if (inputField) {
            inputField.disabled = true;
            btn.disabled = true;
        }
        const userMessage = { sender: "user", text: messageToSend };
        setBotStatus("Typing...")
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        const message = await conversation(messageToSend, convoBot.name, session?.user?.id ?? '', session?.user?.name ?? '');
        setResponse(message);

        if(inputField) {
            inputField.disabled = false;
            btn.disabled = false;
        }
        const botMessage = { sender: convoBot.name, text: message };
        setMessages((prevMessages) => [...prevMessages, botMessage]);
        setBotStatus("Online");
    };

    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="border-t-4 border-primary rounded-full animate-spin h-14 w-14"></div>
            </div>
        );
        // Or a spinner/loading component
    }

    return (
        <>
            {/* Top Level Screen View */}
            <section className="h-screen flex flex-row font-poppins">
                {/* Side Bar */}
                <section className="w-1/4 h-screen">
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

                    <button className="btn btn-square">
                    <label className="swap swap-rotate">
                        {/* this hidden checkbox controls the state */}
                        <input type="checkbox" className="theme-controller" value="dracula" />

                        {/* sun icon */}
                        <svg
                            className="swap-off h-7 w-7 fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24">
                            <path
                            d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                        </svg>

                        {/* moon icon */}
                        <svg
                            className="swap-on h-7 w-7 fill-current"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24">
                            <path
                            d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                        </svg>
                        </label>
                    </button>

                    {/* Bot List */}
                    <div className='flex flex-col gap-1 bg-base-200 rounded-xl'>
                        <h1 className="text-balance font-bold text-xl p-3">Cybernauts</h1>
                        {bots.map((bot: any) => (
                            <div
                                key={bot.name}
                                className={"p-3 flex flex-row align-middle cursor-pointer hover:bg-base-300 text-base-content rounded-xl " + (convoBot.name === bot.name ? " bg-base-300" : "")}
                                onClick={() => selectedBot(bot)}
                            >
                                <img src={bot.DP || 'profile.png'} alt="Bot Avatar" className="w-10 h-10 rounded-full mr-2" />
                                <div className="flex flex-col">
                                    <h1 className="font-medium">{bot.name}</h1>
                                    <p className="font-light text-xs">{bot.profession}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sapiens List */}
                    <div className='flex flex-col gap-1 bg-base-200 rounded-xl mt-5'>
                        <h1 className="text-balance font-bold text-xl p-3">Sapiens</h1>
                        {/* {bots.map((bot: any) => (
                            <div
                                key={bot.name}
                                className={"p-3 flex flex-row align-middle cursor-pointer hover:bg-base-300 text-base-content rounded-xl " + (convoBot.name === bot.name ? " bg-base-300" : "")}
                                onClick={() => selectedBot(bot)}
                            >
                                <img src={bot.DP || 'profile.png'} alt="Bot Avatar" className="w-10 h-10 rounded-full mr-2" />
                                <div className="flex flex-col">
                                    <h1 className="font-medium">{bot.name}</h1>
                                    <p className="font-light text-xs">{bot.profession}</p>
                                </div>
                            </div>
                        ))} */}
                    </div>

                </section>
                {/* Main Content */}
                {convoBot === "" ? (
                    <div></div>
                )

                : (

                <section className="w-3/4 h-screen">
                    <div className="flex flex-row fixed top-0 w-full bg-base-100 z-10">
                        <div className="flex flex-row items-center gap-2 p-3">
                            <img
                                src={convoBot?.DP ?? ''}
                                alt="Bot Avatar"
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <h1 className="text-md font-medium">{convoBot?.name}</h1>
                                <p className="text-xs">{botStatus}</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex flex-col h-screen overflow-auto py-20 px-5">
                        {/* Chat History */}
                        {chatHistory.map((chat: any, index: number) => (
                            <div key={index}>
                                {/* User Response */}
                                <div className="chat chat-end">
                                    <div className="chat-image avatar">
                                        <div className="w-10 rounded-full">
                                            <img
                                                alt="User Avatar"
                                                src={session?.user?.image ?? ''}
                                                />
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
                                                alt="Bot Avatar"
                                                src={convoBot?.DP ?? ''}
                                                />
                                        </div>
                                    </div>
                                    <div className="chat-header">
                                        {convoBot?.name}
                                    </div>
                                    <div className="chat-bubble w-1/2 max-w-fit">{chat.bot}</div>
                                </div>
                            </div>
                        ))}

                        {/* Current Chat */}
                        {messages.map((message, index) => (
                            <div key={index} className={`chat ${message.sender === "user" ? "chat-end" : 'chat-start'}`}>
                                <div className="chat-image avatar">
                                    <div className="w-10 rounded-full">
                                        <img alt="avatar" src={message.sender === "user" ? session?.user?.image ?? "" : convoBot?.DP ?? ""} />
                                    </div>
                                </div>
                                <div className="chat-header">{message.sender === "user" ? session?.user?.name ?? "" : convoBot?.name}</div>
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
                            id = "input-field"
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
                            id = "submitBtn"
                            className="btn btn-primary"
                            >
                            <i className="fi fi-rr-paper-plane-top font-bold"></i>
                        </button>
                    </div>
                </section>
        )}
            </section>
        </>
    );
}

export default Page;
