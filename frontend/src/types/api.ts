export interface RagPromptRequest {
  prompt: string
  k?: number
}

export interface RagPromptResponse {
  response: string
}

export interface AuthRequest {
  email: string
  password: string
  full_name?: string
}

export interface AuthResponse {
  token: string
  user_name: string
  user_email: string
}

export interface IngestionCreateResponse {
  task_id: string
  file_name: string
  status: string
  progress: number
  message: string
}

export interface IngestionStatusResponse {
  task_id: string
  file_name: string
  status: 'queued' | 'uploading' | 'parsing' | 'chunking' | 'indexing' | 'completed' | 'failed'
  progress: number
  message: string
  error?: string | null
}

export interface UploadFile {
  id: string
  fileName: string
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed'
  error: string | null
}

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'agent'
  timestamp: string
}


