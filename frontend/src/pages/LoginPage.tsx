import { Bot, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import type { AppDispatch } from '../store'
import { loginSuccess } from '../store/slices/authSlice'
import { ThemeToggle } from '../components/ui/theme-toggle'
import { authService, extractApiErrorMessage } from '../services/api'

const LoginPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const response = await authService.login({ email, password })
      dispatch(
        loginSuccess({
          userName: response.user_name,
          userEmail: response.user_email,
          token: response.token,
        }),
      )
      navigate('/chat')
    } catch (err) {
      setError(extractApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <Card className="hidden border-0 bg-slate-900 text-white shadow-none dark:bg-slate-900 lg:block">
          <CardHeader className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-2">
                <Bot className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-slate-200">RAG Workspace</p>
            </div>
            <div>
              <CardTitle className="text-3xl">Enterprise knowledge assistant</CardTitle>
              <CardDescription className="mt-3 text-slate-300">
                Search, retrieve, and reason over your internal documents with traceable AI answers.
              </CardDescription>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <ShieldCheck className="h-4 w-4" />
                Secure-by-default access
              </div>
              <p className="mt-2 text-xs text-slate-300">
                Role-ready UI with structured workflows for support, research, and operations teams.
              </p>
            </div>
          </CardHeader>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access your workspace and continue your document chat sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="email" placeholder="Work email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Continue'}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Need an account?{' '}
            <Link className="font-medium text-slate-700 underline underline-offset-4 dark:text-slate-300" to="/signup">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
      </div>
    </main>
  )
}

export default LoginPage
