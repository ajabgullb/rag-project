import { Bot, FileStack, LogOut, Sparkles } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ChatWindow from '../components/Chat/ChatWindow'
import UploadZone from '../components/Upload/UploadZone'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import type { AppDispatch, RootState } from '../store'
import { clearChat } from '../store/chatSlice'
import { clearUploads } from '../store/uploadSlice'
import { logout } from '../store/slices/authSlice'
import { ThemeToggle } from '../components/ui/theme-toggle'

const ChatPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const messages = useSelector((state: RootState) => state.chat.messages)
  const uploads = useSelector((state: RootState) => state.upload.uploads)
  const userName = useSelector((state: RootState) => state.auth.userName)

  const recentPrompts = messages
    .filter((message) => message.role === 'user')
    .slice(-5)
    .reverse()
    .map((message) => message.content.slice(0, 44))

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearChat())
    dispatch(clearUploads())
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-4 p-4 lg:flex-row lg:p-6">
        <aside className="w-full space-y-4 lg:w-84 lg:shrink-0">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Workspace</p>
                <p className="mt-1 text-sm font-semibold">{userName || 'Analyst'}</p>
              </div>
              <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
                <Bot className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </Card>

          <Card className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Document ingestion</p>
            <UploadZone />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{uploads.length} file(s) tracked in this session.</p>
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recent prompts</p>
            </div>
            <div className="space-y-2">
              {recentPrompts.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No prompts yet. Ask your first question in the chat panel.</p>
              ) : (
                recentPrompts.map((prompt, idx) => (
                  <div
                    key={`${prompt}-${idx}`}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {prompt}
                  </div>
                ))
              )}
            </div>
          </Card>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">RAG Assistant Console</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Connected to backend knowledge retrieval pipeline.</p>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />
              <div className="items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 lg:flex">
              <FileStack className="h-4 w-4" />
              Formal mode
              </div>
            </div>
          </div>
          <div className="min-h-[72vh]">
            <ChatWindow />
          </div>
        </section>
      </div>
    </main>
  )
}

export default ChatPage
