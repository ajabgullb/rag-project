import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '../../store'
import { updateUploadProgress, setUploadStatus, removeUpload } from '../../store/uploadSlice'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface ProgressTrackerProps {
  fileId: string
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ fileId }) => {
  const dispatch = useDispatch<AppDispatch>()
  const { uploads } = useSelector((state: RootState) => state.upload)
  const upload = uploads.find(u => u.id === fileId) || {
    id: fileId,
    fileName: '',
    progress: 0,
    status: 'idle',
    error: null
  }

  const handleCancel = () => {
    dispatch(removeUpload(fileId))
  }

  const handleRetry = () => {
    dispatch(setUploadStatus({ id: fileId, status: 'idle' }))
    dispatch(updateUploadProgress({ id: fileId, progress: 0 }))
  }

  // Format progress percentage
  const getProgressPercent = (): number => {
    return Math.min(100, Math.max(0, upload.progress))
  }

  // Get status text
  const getStatusText = (): string => {
    switch (upload.status) {
      case 'idle':
        return 'Ready to upload'
      case 'uploading':
        return `Uploading... ${getProgressPercent()}%`
      case 'processing':
        return 'Processing file...'
      case 'completed':
        return 'Upload completed'
      case 'failed':
        return `Upload failed: ${upload.error || 'Unknown error'}`
      default:
        return 'Unknown status'
    }
  }

  // Get progress bar color based on status
  const getProgressColor = (): string => {
    switch (upload.status) {
      case 'uploading':
        return 'bg-blue-500'
      case 'processing':
        return 'bg-amber-500'
      case 'completed':
        return 'bg-emerald-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-slate-300'
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-sm text-slate-700 dark:text-slate-200">{upload.fileName}</span>
        <Badge
          variant={
            upload.status === 'completed' ? 'success' : upload.status === 'processing' ? 'warning' : 'default'
          }
        >
          {upload.status}
        </Badge>
      </div>

      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{getStatusText()}</p>

      {upload.status !== 'completed' && upload.status !== 'failed' && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={`h-full transition-all ${getProgressColor()}`}
            style={{ width: `${getProgressPercent()}%` }}
          />
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {(upload.status === 'uploading' || upload.status === 'processing') && (
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        )}

        {(upload.status === 'failed' || upload.status === 'completed') && (
          <Button variant="outline" size="sm" onClick={handleRetry}>
            {upload.status === 'failed' ? 'Retry' : 'Upload Another'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ProgressTracker