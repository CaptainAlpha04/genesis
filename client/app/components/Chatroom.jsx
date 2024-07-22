"use client";
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, orderBy, where, onSnapshot, addDoc, getDocs, doc, updateDoc,getDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseconfig';
import UserDropdown from './UserDropdown';
import SideBar from './SideBar';

function Chatrooms() {
  const { data: session } = useSession();
  const [chatrooms, setChatrooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChatroom, setSelectedChatroom] = useState(null);
  const [newChatroomName, setNewChatroomName] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [addingUser, setAddingUser] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (session) {
      const fetchChatrooms = async () => {
        const chatroomsSnapshot = await getDocs(collection(firestore, 'chatrooms'));
        const chatroomsList = chatroomsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
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


  useEffect(() => {
    if (selectedChatroom) {
      const q = query(
        collection(firestore, 'chatroomMessages'),
        where('chatroomId', '==', selectedChatroom.id),
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
  }, [selectedChatroom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChatroom) return;

    try {
      await addDoc(collection(firestore, 'chatroomMessages'), {
        text: newMessage,
        user: session.user.name,
        timestamp: new Date(),
        chatroomId: selectedChatroom.id,
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error adding message: ', error);
    }
  };

  const handleCreateChatroom = async () => {
    if (!newChatroomName.trim()) return;

    try {
      const chatroomRef = await addDoc(collection(firestore, 'chatrooms'), {
        name: newChatroomName,
        createdBy: session.user.email,
        members: [session.user.email],  // Initialize with the creator
      });
      setNewChatroomName('');
    } catch (error) {
      console.error('Error creating chatroom: ', error);
    }
  };

  const handleAddUserToChatroom = async () => {
    if (!selectedChatroom || !addingUser) return;

    try {
      const chatroomRef = doc(firestore, 'chatrooms', selectedChatroom.id);
      await updateDoc(chatroomRef, {
        members: [...selectedChatroom.members, addingUser.email]
      });
      setAddingUser(null);
    } catch (error) {
      console.error('Error adding user to chatroom: ', error);
    }
  };
  

  return (
    <section className="h-screen flex flex-row font-poppins text-base-content">
      <SideBar currentPage='chatrooms' />
      <section className="w-1/4 h-screen">
      <div className="p-3 flex flex-row gap-1 justify-between">
    <h1 className="text-3xl font-bold">Chatrooms</h1>
  </div>
  <div className="mb-4">
    <input
      type="text"
      placeholder="Search chatrooms..."
      className="input input-md w-full bg-base-300"
    />
  </div>
  <div className="flex flex-col gap-2">
    {chatrooms.map((chatroom) => (
      <div
        key={chatroom.id}
        className={`p-4 rounded-xl cursor-pointer transition-colors duration-300 ease-in-out hover:bg-base-300 ${selectedChatroom && selectedChatroom.id === chatroom.id ? "bg-base-300" : "bg-base-200"}`}
        onClick={() => setSelectedChatroom(chatroom)}
      >
        <h1 className="text-lg font-semibold">{chatroom.name}</h1>
        <p className="text-sm text-gray-600">Created by {chatroom.createdBy}</p>
      </div>
    ))}
  </div>
  <div className="mt-4">
    <input
      type="text"
      placeholder="New Chatroom Name..."
      value={newChatroomName}
      onChange={(e) => setNewChatroomName(e.target.value)}
      className="input input-md w-full bg-base-300"
    />
    <button onClick={handleCreateChatroom} className="btn btn-primary mt-2 w-full">Create Chatroom</button>
  </div>
  {selectedChatroom && (
  <div className="p-3">
    <UserDropdown
      users={users.filter(user => !selectedChatroom.members.includes(user.email))}
      onSelect={(user) => setAddingUser(user)}
    />
    <button onClick={handleAddUserToChatroom} className="btn btn-primary mt-2">Add User</button>
  </div>
)}

      </section>
      {selectedChatroom ? (
        <section className="w-3/4 h-screen flex flex-col">
          <div className="flex flex-row fixed top-0 w-full bg-base-100 z-10 p-3">
            <div className="flex flex-row items-center gap-2">
              <div>
                <h1 className="text-md font-medium">{selectedChatroom.name}</h1>
              </div>
            </div>
          </div>
          <div className="w-full flex flex-col h-screen overflow-auto py-20 px-5">
            {messages.map((message) => (
              <div key={message.id} className={`chat ${message.user === session.user.name ? "chat-end" : "chat-start"}`}>
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full">
                    <img
                      src={message.user === session.user.name ? profilePicture : "profile.png"}
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
            <input
              className="input input-md w-4/5 text-lg"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), handleSendMessage()) : null}
              placeholder="Type your message..."
            />
            <button onClick={handleSendMessage} className="btn btn-primary">
              <i className="fi fi-rr-paper-plane-top font-bold"></i>
            </button>
          </div>
        </section>
      ) : (
        <div className="hero hero-content w-3/4">
          <img src="couple.png" alt="Person" className="absolute opacity-30 -z-10 w-96" />
          <h1 className="text-3xl">Select a chatroom to chat in!</h1>
        </div>
      )}
    </section>
  );
}

export default Chatrooms;
