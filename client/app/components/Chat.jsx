// components/Chat.jsx
"use client";
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { firestore } from '../../firebaseconfig';

function Chat() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (session) {
      const q = query(collection(firestore, 'messages'), orderBy('timestamp'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messagesData = [];
        querySnapshot.forEach((doc) => {
          messagesData.push({ id: doc.id, ...doc.data() });
        });
        setMessages(messagesData);
      });

      return () => unsubscribe();
    }
  }, [session]);

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
      const docRef = await addDoc(collection(firestore, 'messages'), {
        text: newMessage,
        user: session.user.name,
        timestamp: new Date(),
      });
      console.log('Message sent with ID: ', docRef.id);
      setNewMessage('');
    } catch (error) {
      console.error('Error adding message: ', error);
    }
  };

  return (
    <div className='flex flex-col h-screen bg-gradient-to-r from-teal-400 to-gray-800'>
      <div className='flex-grow flex flex-row'>
        <div className='flex-grow p-4 border-r border-gray-200 overflow-y-auto '>
          <h2 className='text-lg font-semibold mb-4'>Chat Room</h2>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex mb-2 ${message.user === session.user.name ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-2 max-w-xs rounded-lg ${message.user === session.user.name ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start'}`}
              >
                <p className='text-sm'>{message.text}</p>
                <p className='text-xs text-slate-700'>{message.user}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>
        <div className='w-64 bg-gray-100 p-4 baskervville-sc-regular bg-gradient-to-r from-slate-300 to-zinc-200'>
          <h3 className='text-xl font-semibold mb-4'>Other Users</h3>
          <div className='flex flex-col gap-4'>
            {/* Placeholder for other users list */}
            <p className='text-lg'>User 1</p>
            <p className='text-lg'>User 2</p>
            <p className='text-lg'>User 3</p>
            {/* You can populate this list dynamically based on online users */}
          </div>
        </div>
      </div>
      {session && (
        <div className='p-4 bg-gray-200 flex items-center fixed bottom-0 left-0 right-0'>
          <textarea
            className='border border-gray-300 rounded p-2 flex-grow mr-2'
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      )}
      {!session && (
        <div className='p-4 bg-gray-200 text-center fixed bottom-0 left-0 right-0'>
          <p>Please sign in to view and send messages.</p>
        </div>
      )}
    </div>
  );
}

export default Chat;
