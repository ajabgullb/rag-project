# RAG Agent Frontend Plan

## Project Overview
A React + TypeScript frontend for a RAG (Retrieval-Augmented Generation) agent with:
- Chat interface for querying the agent
- Document upload functionality (PDF, CSV, PPT, etc.)
- State management using Redux Toolkit (RTK)
- Progress tracking for uploads
- Error handling and loading states

## API Specification
Based on your backend implementation:

### /query Endpoint
- **URL**: `http://localhost:8000/query`
- **Method**: POST
- **Request Body**:
  ```typescript
  interface RagPromptRequest {
    prompt: string; // User's question/message (0-16000 chars)
    k: number; // Number of chunks to retrieve (1-100, default: 10)
  }
  ```
- **Response Body**:
  ```typescript
  interface RagPromptResponse {
    response: string; // Generated answer from RAG chain
  }
  ```

### /upload Endpoint (To Be Defined)
**Recommended Implementation**:
- **URL**: `http://localhost:8000/upload`
- **Method**: POST
- **Request**: Multipart/form-data with file
- **Response**:
  ```typescript
  interface UploadResponse {
    success: boolean;
    message: string;
    fileId?: string; // Optional ID for tracking
  }
  ```

### Authentication
Since not defined, plan for optional JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Frontend Architecture

### 1. Project Structure
```
src/
├── components/
│   ├── Chat/
│   │   ├── ChatWindow.tsx
│   │   ├── Message.tsx
│   │   └── InputForm.tsx
│   ├── Upload/
│   │   ├── UploadZone.tsx
│   │   └── ProgressTracker.tsx
│   └── Layout/
│       └── AppHeader.tsx
├── hooks/
│   ├── useChat.ts
│   └── useUpload.ts
├── store/
│   ├── chatSlice.ts
│   ├── uploadSlice.ts
│   └── index.ts
├── services/
│   ├── api.ts
│   └── authService.ts
├── types/
│   └── api.ts
├── utils/
│   └── constants.ts
└── App.tsx
```

### 2. Core Components

#### Chat Interface
- **ChatWindow**: Main container displaying messages
- **Message**: Individual message component (user/agent)
- **InputForm**: Text input with submit button and file upload trigger

#### Upload Component
- **UploadZone**: Drag-and-drop area or click-to-upload button
- **ProgressTracker**: Shows upload progress and status
- **FileList**: Displays uploaded files with status indicators

### 3. State Management (RTK)

#### Chat Slice
```typescript
interface ChatState {
  messages: Array<{
    id: string;
    content: string;
    role: 'user' | 'agent';
    timestamp: string;
  }>;
  loading: boolean;
  error: string | null;
}
```

#### Upload Slice
```typescript
interface UploadState {
  uploads: Array<{
    id: string;
    fileName: string;
    progress: number;
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
    error: string | null;
  }>;
}
```

### 4. Service Layer
- **API Service**: Axios instance with base URL and interceptors
- **Auth Service**: Token handling (if authentication is added later)
- **Chat Service**: Wrapper for /query endpoint
- **Upload Service**: Wrapper for /upload endpoint with progress tracking

### 5. Key Features Implementation

#### Chat Flow
1. User types message and submits
2. Message added to chat state as "user" role
3. Loading state set to true
4. POST request to /query with prompt and k value
5. On success: Add agent response to chat state
6. On error: Set error state and display message
7. Reset loading state

#### Upload Flow
1. User selects/drops files in upload zone
2. For each file:
   - Create upload entry in state with "idle" status
   - Send POST request to /upload with file data
   - Update progress during upload
   - On completion: Set status to "completed"
   - On failure: Set status to "failed" with error message
3. Show progress bar and status for each file

### 6. UI/UX Considerations
- Responsive design for mobile/desktop
- Message timestamps
- Scroll-to-bottom for new messages
- Loading spinners for chat and uploads
- Error toast notifications
- File type validation (PDF, CSV, PPT, etc.)
- Maximum file size limits
- Clear chat history option

### 7. Development Setup
- Create React app with TypeScript template
- Install dependencies: `@reduxjs/toolkit`, `react-redux`, `axios`
- Configure RTK store with slices
- Set up API service with base URL
- Implement components with proper TypeScript interfaces
- Add CSS modules or styled-components for styling
- Implement proper error boundaries

### 8. Future Enhancements
- Conversation history persistence
- Settings panel for adjusting k value, temperature, etc.
- Source citations in agent responses
- Multiple agent selection
- Message reactions/feedback
- Export chat functionality
- Dark/light theme toggle

## Next Steps
1. Create project structure
2. Set up development environment
3. Implement API service layer
4. Create RTK store with slices
5. Build chat interface components
6. Build upload component with progress tracking
7. Connect components to state management
8. Add error handling and loading states
9. Style components
10. Test and refine

This plan provides a complete foundation for building your RAG agent frontend with React + TypeScript + RTK, covering all requested features while following best practices for state management, API integration, and user experience.