import React from 'react'
import './Message.css'

interface MessageProps {
  message: {
    id: string
    content: string
    role: 'user' | 'agent'
    timestamp: string
  }
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  
  // Format timestamp to show time only
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })
  }

  return (
    <div className={`message ${isUser ? 'user-message' : 'agent-message'}`}>
      <div className="message-content">
        <p>{message.content}</p>
      </div>
      <div className="message-meta">
        <span className="timestamp">{formatTimestamp(message.timestamp)}</span>
        <span className="role">{isUser ? 'You' : 'Agent'}</span>
      </div>
    </div>
  )
}

export default Message