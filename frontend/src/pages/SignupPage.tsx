import { Building2, UserPlus } from 'lucide-react'
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

const SignupPage = () => {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const response = await authService.signup({ email, password, full_name: fullName })
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
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Workspace Onboarding</span>
          </div>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Set up your profile to access the enterprise RAG assistant.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="text" placeholder="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input type="email" placeholder="Work email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input
              type="password"
              placeholder="Confirm password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-red-600">Passwords do not match.</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              <UserPlus className="h-4 w-4" />
              {submitting ? 'Creating account...' : 'Create workspace account'}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link className="font-medium text-slate-700 underline underline-offset-4 dark:text-slate-300" to="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

export default SignupPage
