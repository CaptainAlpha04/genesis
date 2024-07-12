// components/Chat.jsx
"use client";
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, orderBy, where, onSnapshot, addDoc, getDocs } from 'firebase/firestore';
import { firestore } from '../../firebaseconfig';

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
    <div className="flex h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
      <div className="flex flex-col w-1/4 p-4 bg-white shadow-lg overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Other Users</h3>
        <div className="flex flex-col gap-4">
          {users.map(user => (
            <p
              key={user.id}
              className={`text-lg cursor-pointer p-2 rounded-lg transition-transform transform hover:scale-105 ${
                selectedUser && selectedUser.id === user.id ? 'bg-blue-200' : 'bg-gray-100'
              }`}
              onClick={() => setSelectedUser(user)}
            >
              {user.name}
            </p>
          ))}
        </div>
      </div>
      <div className="flex flex-col flex-grow p-4 bg-white shadow-lg overflow-y-auto relative">
        {selectedUser ? (
          <>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">{`Chat with ${selectedUser.name}`}</h2>
            <div className="flex flex-col space-y-4 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.user === session.user.name ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`p-4 max-w-xs rounded-lg shadow ${
                      message.user === session.user.name
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-md">{message.text}</p>
                    <p className="text-sm text-gray-600">{message.user}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
            </div>
          </>
        ) : (
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Select a user to start chatting</h2>
        )}
      </div>
      {session && selectedUser && (
        <div className="flex items-center p-4 bg-gray-100 fixed bottom-0 left-1/4 right-0">
          <textarea
            className="flex-grow border border-gray-300 rounded-lg p-2 mr-2"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      )}
      {session && !selectedUser && (
        <div className="p-4 bg-gray-100 text-center fixed bottom-0 left-1/4 right-0">
          <p>Select a user to start chatting.</p>
        </div>
      )}
      {!session && (
        <div className="p-4 bg-gray-100 text-center fixed bottom-0 left-0 right-0">
          <p>Please sign in to view and send messages.</p>
        </div>
      )}
    </div>
  );
}

export default Chat;
