"use client";
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, orderBy, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebaseconfig';
import SideBar from './SideBar';

function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);

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
    if (session && selectedUser) {
      const combinedParticipants = [session.user.email, selectedUser.email].sort().join('_');
      const q = query(
        collection(firestore, 'messages'),
        where('participants', '==', combinedParticipants),
        orderBy('timestamp')
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData = [];
        querySnapshot.forEach((doc) => {
          messagesData.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messagesData);
      });

      return () => unsubscribe();
    }
  }, [session, selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const combinedParticipants = [session.user.email, selectedUser.email].sort().join('_');
      const docRef = await addDoc(collection(firestore, 'messages'), {
        text: newMessage,
        user: session.user.name,
        timestamp: new Date(),
        participants: combinedParticipants,
      });
      console.log('Message sent with ID: ', docRef.id);
      setNewMessage('');
    } catch (error) {
      console.error('Error adding message: ', error);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section className="h-screen flex flex-row font-poppins text-base-content">
      {/* Navigation Bar */}
      <SideBar currentPage='sapiens'/>
      {/* Side Bar */}
      <section className="w-1/4 h-screen">
        <div className="p-3 flex flex-row gap-1 justify-between">
          <h1 className="text-3xl font-bold">Genesis</h1>
        </div>
        <input type="text" placeholder="Search..." 
                className="input input-md my-4 mx-4 w-11/12 bg-base-300" />
        {/* Users List */}
        <div className="flex flex-col gap-1 bg-base-200 rounded-xl">
          <h1 className="text-balance font-bold text-xl p-3">Sapiens</h1>
          {users.map((user) => (
            user.id !== session?.user?.id && (
              <div
                key={user.id}
                className={`p-3 flex flex-row align-middle cursor-pointer hover:bg-base-300 text-base-content rounded-xl ${selectedUser && selectedUser.id === user.id ? "bg-base-300" : ""}`}
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex flex-col">
                  <h1 className="font-medium">{user.name}</h1>
                </div>
              </div>
            )
          ))}
        </div>
      </section>
      {/* Main Content */}
        {selectedUser ? (
          <>
          <section className="w-3/4 h-screen flex flex-col">
            <div className="flex flex-row fixed top-0 w-full bg-base-100 z-10 p-3">
              <div className="flex flex-row items-center gap-2">
                <img
                  src={selectedUser?.image ?? "profile.png"}
                  alt="User Avatar"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h1 className="text-md font-medium">{selectedUser.name}</h1>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col h-screen overflow-auto py-20 px-5">
              {messages.map((message) => (
                <div key={message.id} className={`chat ${message.user === session.user.name ? "chat-end" : "chat-start"}`}>
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full">
                      <img
                        src={message.user === session.user.name ? session?.user?.image ?? "" : selectedUser?.image ?? "profile.png"}
                        alt="Avatar"
                      />
                    </div>
                  </div>
                  <div className="chat-header">{message.user}</div>
                  <div className={`chat-bubble w-1/2 max-w-fit ${message.user === session.user.name ? "chat-bubble-secondary" : ""}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
            <div className="w-3/4 flex flex-row items-center bottom-0 fixed gap-2 p-2 bg-base-100">
              <i className="fi fi-rr-clip text-2xl btn btn-ghost"></i>
              <i className="fi fi-rr-smile text-2xl btn btn-ghost"></i>
              <input
                className="input input-md w-4/5  text-lg"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
              />
              <button
                onClick={handleSendMessage}
                className="btn btn-primary"
                >
                <i className="fi fi-rr-paper-plane-top font-bold"></i>
                
              </button>
            </div>
          </section>
          </>
        ) : (
          <>
            <div className="hero hero-content w-3/4">
              <img src="couple.png" alt="Person" className="absolute opacity-30 -z-10 w-96" />
              <h1 className="text-3xl">Select a fellow Sapient to chat with!</h1>
            </div>
          </>
        )}
    </section>
  );
}

export default Chat;
