// ChatProvider.jsx

import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const [message, setMessage] = useState(null); // Example state, adjust as per your use case

  const chat = () => {
    // Your chat logic here
  };

  const onMessagePlayed = () => {
    // Your onMessagePlayed logic here
  };

  return (
    <ChatContext.Provider value={{ message, setMessage, chat, onMessagePlayed }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
