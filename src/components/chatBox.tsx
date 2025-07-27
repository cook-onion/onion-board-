import React, { useState, useEffect, useRef } from 'react';
import { Input, Button } from 'antd';
import type { Message } from '../types';

interface ChatBoxProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  selfId: string | null;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage, selfId }) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (currentMessage.trim()) {
      onSendMessage(currentMessage);
      setCurrentMessage('');
    }
  };

  return (
    <div style={{ flexGrow: 1, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: '8px', display: 'flex', flexDirection: 'column', padding: '1rem', overflow: 'hidden' }}>
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '1rem' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ textAlign: msg.senderId === selfId ? 'right' : 'left', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>{msg.senderName}</div>
            <div style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '1rem', backgroundColor: msg.senderId === selfId ? '#a8e6cf' : '#dcedc1' }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex' }}>
        <Input 
          value={currentMessage} 
          onChange={e => setCurrentMessage(e.target.value)} 
          onPressEnter={handleSend}
          placeholder="输入消息..."
        />
        <Button onClick={handleSend} type="primary" style={{ marginLeft: '8px' }}>发送</Button>
      </div>
    </div>
  );
};

export default ChatBox;
