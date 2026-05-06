import React, { useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../../store'
import { addMessage, setLoading, setError } from '../../store/chatSlice'
import type { ChatMessage } from '../../types/api'
import { SendHorizontal } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { chatService, extractApiErrorMessage } from '../../services/api'
import { nanoid } from 'nanoid'

const ChatWindow: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { messages, loading, error } = useSelector((state: RootState) => state.chat)
  const [inputValue, setInputValue] = React.useState('')
  const bottomAnchorRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send message to API
  const sendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: nanoid(),
      content,
      role: 'user',
      timestamp: new Date().toISOString(),
    }
    dispatch(addMessage(userMessage))

    dispatch(setLoading(true))
    dispatch(setError(null))

    try {
      const data = await chatService.query({
        prompt: content,
        k: 10,
      })

      const agentMessage: ChatMessage = {
        id: nanoid(),
        content: data.response,
        role: 'agent',
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(agentMessage))
    } catch (err) {
      const errorMessage = extractApiErrorMessage(err)
      dispatch(setError(errorMessage))
      const errorChatMessage: ChatMessage = {
        id: nanoid(),
        content: `I couldn't complete the request. ${errorMessage}`,
        role: 'agent',
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(errorChatMessage))
    } finally {
      dispatch(setLoading(false))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || loading) return
    await sendMessage(inputValue.trim())
    setInputValue('')
  }

  return (
    <div className="relative flex h-full min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50/50 px-6 pb-36 pt-8 dark:bg-slate-950/50">
        {messages.length === 0 && (
          <div className="mx-auto mt-16 max-w-2xl rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">How can I assist your team today?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Ask questions based on your indexed documents and knowledge base.</p>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.role === 'user'
          return (
            <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  isUser
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
              Assistant is preparing a response...
            </div>
          </div>
        )}
        <div ref={bottomAnchorRef} />
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <form className="mx-auto flex max-w-3xl items-end gap-3" onSubmit={handleSubmit}>
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="min-h-[52px] resize-none"
            rows={1}
          />
          <Button type="submit" disabled={loading || !inputValue.trim()} size="icon">
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {error && (
        <div className="border-t border-red-200 bg-red-50 px-6 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          Error: {error}
        </div>
      )}
    </div>
  )
}

export default ChatWindow