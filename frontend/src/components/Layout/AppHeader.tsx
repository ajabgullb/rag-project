import React from 'react'
import './AppHeader.css'

const AppHeader: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1 className="header-title">RAG Agent Chat</h1>
        <p className="header-subtitle">Ask questions about your documents</p>
      </div>
    </header>
  )
}

export default AppHeader