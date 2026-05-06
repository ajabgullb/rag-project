import React, { useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '../../store'
import { addUpload, setUploadStatus, updateUploadProgress } from '../../store/uploadSlice'
import { nanoid } from 'nanoid'
import ProgressTracker from './ProgressTracker'
import { Upload } from 'lucide-react'
import { Button } from '../ui/button'
import { extractApiErrorMessage, ingestionService } from '../../services/api'

interface UploadZoneProps {
  onFileProcessed?: (fileId: string) => void
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFileProcessed }) => {
  const dispatch = useDispatch<AppDispatch>()
  const uploads = useSelector((state: RootState) => state.upload.uploads)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [uploadHint, setUploadHint] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      await handleFiles(Array.from(files))
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      await handleFiles(Array.from(files))
      // Reset input value to allow same file selection
      e.target.value = ''
    }
  }

  const handleFiles = async (files: File[]) => {
    if (files.length > 0) {
      setFileName(files[0].name)
    }

    for (const file of files) {
      // Validate file type
      const validTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
      if (!validTypes.includes(file.type)) {
        setUploadHint(`Unsupported file type for ${file.name}. Use PDF, CSV, or PPT.`)
        continue
      }
      
      // Validate file size (e.g., 10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        setUploadHint(`File too large: ${file.name}. Maximum size is 10MB.`)
        continue
      }
      
      const fileId = nanoid()
      
      // Add to upload state
      dispatch(addUpload({
        id: fileId,
        fileName: file.name,
        progress: 0,
        status: 'idle',
        error: null,
      }))
      
      await uploadFile(fileId, file)
    }
  }

  const uploadFile = async (fileId: string, file: File) => {
    dispatch(setUploadStatus({ id: fileId, status: 'uploading' }))
    setUploadHint(null)

    try {
      const createdTask = await ingestionService.uploadFile(file, (progress) => {
        dispatch(updateUploadProgress({ id: fileId, progress: Math.min(25, progress) }))
      })

      dispatch(setUploadStatus({ id: fileId, status: 'processing' }))

      let polling = true
      while (polling) {
        await new Promise((resolve) => {
          setTimeout(resolve, 800)
        })
        const status = await ingestionService.getStatus(createdTask.task_id)
        dispatch(updateUploadProgress({ id: fileId, progress: status.progress }))

        if (status.status === 'completed') {
          dispatch(setUploadStatus({ id: fileId, status: 'completed' }))
          setUploadHint(`Ingestion completed for ${status.file_name}.`)
          if (onFileProcessed) {
            onFileProcessed(fileId)
          }
          polling = false
          continue
        }

        if (status.status === 'failed') {
          dispatch(setUploadStatus({ id: fileId, status: 'failed', error: status.error || status.message }))
          setUploadHint(`Ingestion failed for ${status.file_name}.`)
          polling = false
        }
      }
    } catch (error) {
      dispatch(setUploadStatus({ id: fileId, status: 'failed', error: extractApiErrorMessage(error) }))
      setUploadHint('Upload failed. Ensure backend is running and you are authenticated.')
    }
  }

  return (
    <div>
      <div
        className={`cursor-pointer rounded-xl border border-dashed p-4 transition ${
          dragOver
            ? 'border-slate-500 bg-slate-100 dark:border-slate-500 dark:bg-slate-800'
            : 'border-slate-300 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <div className="flex flex-col items-start gap-2">
        <Upload className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        {dragOver ? (
          <p className="text-sm text-slate-700 dark:text-slate-200">Release to upload files</p>
        ) : fileName ? (
          <p className="text-sm text-slate-700 dark:text-slate-200">Selected: {fileName}</p>
        ) : (
          <>
            <p className="text-sm text-slate-700 dark:text-slate-200">Drag and drop files here, or click to select</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Supported: PDF, CSV, PPT (max 10MB)</p>
          </>
        )}
        <Button variant="outline" size="sm" type="button">
          Select Files
        </Button>
      </div>
      </div>
      {uploadHint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{uploadHint}</p>}

      {uploads.length > 0 && <div className="mt-3 space-y-2">{uploads.map((upload) => <ProgressTracker key={upload.id} fileId={upload.id} />)}</div>}
    </div>
  )
}

export default UploadZone