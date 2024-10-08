"use client";
import React, { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import SideBar from "./SideBar";
import { doc, getDoc } from "@firebase/firestore";
import { firestore } from "../../firebaseconfig";
import { Provider, useDispatch } from 'react-redux';
import store, { setBotReply, setLanguage } from '../../store';
import { Router } from "next/router";
interface Message {
    user: string;
    bot: string;
}
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

async function botAvailability(botName: string, userId: string) {
    const response = await fetch(
        `http://localhost:8000/checkBotAvailability/${userId}/${botName}`
    );
    const data = await response.json();
    return data.available;
}


async function conversation(
    message: string,
    botName: string,
    userId: string,
    userName: string
) {
    const payload = { userName, botName, message };
    const response = await fetch(
        `http://localhost:8000/conversation/${userId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }
    );
    
    const data = await response.json();

    return data;
    
}

async function fetchChatHistory(userID: string, botName: string) {
    const response = await fetch(
        `http://localhost:8000/fetchChatHistory/${userID}/${botName}`
    );
    const data = await response.json();
    return data.chatHistory;
}

async function endConversation(
    userID: string,
    botNameOrUserID: string,
    isBot: boolean
) {
    let endpoint = "";
    if (isBot) {
        endpoint = `http://localhost:8000/endConversation/${userID}/${botNameOrUserID}`;
    } else {
        // Handle end conversation logic for users
        // For example, remove them from active chats list or mark as ended
        console.log(`Ending conversation with user ${botNameOrUserID}`);
        // Example logic:
        // Update user's chat status in Firestore or perform cleanup
    }

    const response = await fetch(endpoint);
    const data = await response.json();
    return data;
}

function Cybernaut() {
    const [bots, setBots] = useState([]);
    const [convoBot, setConvoBot] = useState<any>("");
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<
        { sender: string; text: string }[]
    >([]);
    const [response, setResponse] = useState("");
    const [botStatus, setBotStatus] = useState("");
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const { data: session, status } = useSession();
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [command, setCommand] = useState("");
    const [textAfterCommand, setTextAfterCommand] = useState("");

    const router = useRouter();
    const dispatch = useDispatch();

    const commands = ["/request", "/collaborate", "/feedback", "/task"];

    const selectedBot = async (bot: any) => {
        if (convoBot !== "") {
            endConversation(session?.user?.id ?? "", convoBot.name, true);
        }
        setConvoBot(bot);


        const botAvailable = await botAvailability(
            bot.name,
            session?.user?.id ?? ""
        );
        if (botAvailable) {
            setBotStatus("Online");
        } else {
            setBotStatus("Offline");
        }

        const chatHistory = await fetchChatHistory(
            session?.user?.id ?? "",
            bot.name
        );
        const formattedChatHistory = chatHistory.flatMap((chat: any) => [
            { sender: "user", text: chat.user },
            { sender: bot.name, text: chat.bot },
        ]);
        setMessages(formattedChatHistory);
    };
    
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

    const messageEndRef = useRef(null);

    const scrollToBottom = () => {
        (messageEndRef.current as unknown as HTMLElement)?.scrollIntoView({
            behavior: "smooth",
        });
    };

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
        const inputValue = (event.target as HTMLInputElement).value;
        setInputValue(inputValue);
    
        const foundCommand = commands.find(cmd => inputValue.startsWith(cmd));
        if (foundCommand) {
            setCommand(foundCommand.substring(1));
            setTextAfterCommand(inputValue.slice(foundCommand.length).trim());
            
        } else {
            setCommand("");
            setTextAfterCommand(inputValue);
        }
    };


    const handleSubmit = async (): Promise<void> => {
        const messageToSend = command ? `/${command} ${textAfterCommand}` : textAfterCommand;
        setInputValue("");
        setCommand("");
        setTextAfterCommand("");
        const btn = document.getElementById("submitBtn") as HTMLButtonElement;
        const inputField = document.getElementById(
            "input-field"
        ) as HTMLInputElement;
        const userMessage = {
            sender: "user",
            text: messageToSend,
        };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
            if (inputField) {
                inputField.disabled = true;
                btn.disabled = true;
            }
            setBotStatus("Typing...");

            let message;

            const data = await conversation(
                messageToSend,
                convoBot.name,
                session?.user?.id ?? "",
                session?.user?.name ?? ""
            );

            if(data.response.playground === "code") {
                const botReply = data.response.botReply;
                const language = data.response.language;
                dispatch(setBotReply(botReply));
                dispatch(setLanguage(language));
                router.push('/codeground');
            } else {
                message = data.response;
            }

            setResponse(message);
            const botMessage = { sender: convoBot.name, text: message };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
            setBotStatus("Online");
            if (inputField) {
                inputField.disabled = false;
                btn.disabled = false;
            }
    };
    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-screen bg-base-100">
                <div className="border-t-4 border-primary rounded-full animate-spin h-14 w-14 bg-base-100"></div>
            </div>
        );
    }
    
    return (
        <>
            {/* Top Level Screen View */}

            <section className="h-screen flex flex-row font-poppins text-base-content">
                {/* NavigationBar */}
                <SideBar currentPage="cybernauts" />
                {/* Side Bar */}
                <section className="w-1/4 h-screen">
                
                <div className="p-3 flex flex-row gap-1 justify-between">
                <h1 className="text-3xl font-bold">Genesis</h1>
                </div>
                <input type="text" placeholder="Search..." 
                className="input input-md my-4 mx-4 w-11/12 bg-base-300" />
                    {/* Bot List */}
                    <div className="flex flex-col gap-1 bg-base-200 rounded-xl h-fit">
                        <h1 className="text-balance font-bold text-xl p-3">
                            Cybernauts
                        </h1>
                        {sortedBots.map((bot: any) => (
                            <div
                                key={bot.name}
                                className={"p-3 flex flex-row cursor-pointer hover:bg-base-300 text-base-content rounded-xl" + (convoBot.name === bot.name ? " bg-base-300" : "")}
                                onClick={() => selectedBot(bot)}
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
                </section>
                {/* Main Content */}
                {convoBot === ""  ? (
                    <>
                    <div className="hero hero-content w-3/4">
                        <img src="robot.png" alt="Robot" className="absolute rounded-full opacity-30 -z-10" />
                        <h1 className="text-3xl">Select any Cybernaut to chat with!</h1>
                    </div>
                    </>
                ) : (
                    <section className="w-3/4 h-screen">
                        <div className="flex flex-row fixed top-0 w-full bg-base-100 z-10">
                            <div className="flex flex-row items-center gap-2 p-3">
                            
                                
                                    <img
                                        src={convoBot?.DP ?? ""}
                                        alt="Bot Avatar"
                                        className="w-10 h-10 rounded-full"
                                    />
                    

                                <div>
                                    <h1 className="text-md font-medium">
                                        {convoBot?.name ?? ""}
                                    </h1>
                                    <p className="text-xs">
                                        {convoBot ? botStatus : ""}
                                    </p>
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
                                                    src={profilePicture ?? '/profile.png'}
                                                />
                                            </div>
                                        </div>
                                        <div className="chat-header">
                                            {session?.user?.name ?? ""}
                                        </div>
                                        <div className="chat-bubble w-1/2 max-w-fit chat-bubble-secondary">
                                            {chat.user}
                                        </div>
                                    </div>

                                    {/* Bot Response */}

                                    <div className="chat chat-start">
                                        <div className="chat-image avatar">
                                            <div className="w-10 rounded-full">
                                                //only avatar if convoBot

                                        <img
                                                    alt="Bot Avatar"
                                                    src={convoBot?.DP ?? ""}
                                                />
                                    
                                            </div>
                                        </div>
                                        <div className="chat-header">
                                            {convoBot?.name}
                                        </div>
                                        <div className="chat-bubble w-1/2 max-w-fit">
                                            {chat.bot}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Current Chat */}
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`chat ${
                                        message.sender === "user"
                                            ? "chat-end"
                                            : "chat-start"
                                    }`}
                                >
                                    <div className="chat-image avatar">
                                        <div className="w-10 rounded-full">
                                           
                                            <img
                                                alt="avatar"
                                                src={
                                                    message.sender === "user"
                                                        ? profilePicture ?? ""
                                                        : 
                                                        convoBot?.DP
                                                }
                                            />
                                           
                                        </div>
                                    </div>
                                    <div className="chat-header">
                                        {message.sender === "user"
                                            ? session?.user?.name ?? ""
                                            : convoBot?.name ?? ""}
                                    </div>
                                    <div
                                        className={`chat-bubble w-1/2 max-w-fit ${
                                            message.sender === "user"
                                                ? "chat-bubble-secondary"
                                                : ""
                                        }`}
                                    >
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
                                id="input-field"
                                className="input input-md w-4/5  text-lg"
                                value={inputValue}
                                onChange={handleInputChange}
                                onKeyDown={(e) => {
                                    e.key === "Enter" && handleSubmit();
                                }}
                                placeholder="Enter your message"
                                />
                                {command && <span className="kbd z-10 absolute ml-36 text-lg font-mono">{command}</span>}
                            <button
                                onClick={handleSubmit}
                                id="submitBtn"
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

export default Cybernaut;