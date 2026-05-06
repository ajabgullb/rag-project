import { Moon, Sun } from 'lucide-react'
import { Button } from './button'
import { useTheme } from '../../theme/useTheme'

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <Button variant="outline" size="sm" type="button" onClick={toggleTheme}>
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDark ? 'Light mode' : 'Dark mode'}
    </Button>
  )
}
