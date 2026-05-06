import React, { useState } from 'react'
import './InputForm.css'

interface InputFormProps {
  onSendMessage: (content: string) => Promise<void>
}

const InputForm: React.FC<InputFormProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    await onSendMessage(inputValue)
    setInputValue('')
  }

  return (
    <form className="input-form" onSubmit={handleSubmit}>
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        rows={1}
        className="input-textarea"
      />
      <button type="submit" className="send-button">
        Send
      </button>
    </form>
  )
}

export default InputForm