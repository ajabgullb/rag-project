import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface UploadFile {
  id: string
  fileName: string
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed'
  error: string | null
}

export interface UploadState {
  uploads: UploadFile[]
}

const initialState: UploadState = {
  uploads: [],
}

export const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    addUpload: (state, action: PayloadAction<UploadFile>) => {
      state.uploads.push(action.payload)
    },
    updateUploadProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const upload = state.uploads.find(upload => upload.id === action.payload.id)
      if (upload) {
        upload.progress = action.payload.progress
      }
    },
    setUploadStatus: (state, action: PayloadAction<{ id: string; status: UploadFile['status']; error?: string | null }>) => {
      const upload = state.uploads.find(upload => upload.id === action.payload.id)
      if (upload) {
        upload.status = action.payload.status
        upload.error = action.payload.error ?? null
      }
    },
    removeUpload: (state, action: PayloadAction<string>) => {
      state.uploads = state.uploads.filter(upload => upload.id !== action.payload)
    },
    clearUploads: (state) => {
      state.uploads = []
    },
  },
})

export const { addUpload, updateUploadProgress, setUploadStatus, removeUpload, clearUploads } = uploadSlice.actions

export default uploadSlice.reducer