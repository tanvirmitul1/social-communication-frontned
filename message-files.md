# Message File Upload API

Complete guide for implementing file uploads in messaging (images, videos, audio, documents).

---

## Overview

The messaging system supports sending files alongside text messages with automatic:
- **File type detection** (image/video/audio/document)
- **Cloudinary upload** with optimized storage
- **Thumbnail generation** for images and videos
- **Metadata extraction** (dimensions, duration, file size)
- **Frontend-friendly response** structure

---

## API Endpoint

### Send Message with Files

**Endpoint:** `POST /api/v1/messages/with-files`

**Authentication:** Required (Bearer token)

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `files` | File[] | Yes | Array of files (max 5 files, 50MB each) |
| `content` | string | No | Message text content |
| `groupId` | string (UUID) | No* | Target group ID (for group messages) |
| `receiverId` | string (UUID) | No* | Target user ID (for direct messages) |

*Either `groupId` or `receiverId` must be provided.

**Supported File Types:**

| Category | MIME Types | Max Size |
|----------|-----------|----------|
| **Images** | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | 10MB |
| **Videos** | `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`, `video/avi` | 50MB |
| **Audio** | `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/webm`, `audio/aac`, `audio/m4a` | 25MB |
| **Documents** | `application/pdf`, `.docx`, `.xlsx`, `.pptx`, `.zip`, `.txt`, `.csv` | 25MB |

---

## Response Structure

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "senderId": "123e4567-e89b-12d3-a456-426614174000",
    "receiverId": "789e0123-e45b-67c8-d901-234567890abc",
    "groupId": null,
    "content": "Check out these files!",
    "type": "IMAGE",
    "status": "SENT",
    "metadata": {
      "files": [
        {
          "type": "image",
          "url": "https://res.cloudinary.com/xxx/image/upload/v1234567890/social/messages/abc123.webp",
          "thumbnail": "https://res.cloudinary.com/xxx/image/upload/c_fill,h_320,w_320/v1234567890/social/messages/abc123.webp",
          "filename": "vacation-photo.jpg",
          "size": 2458624,
          "format": "webp",
          "width": 1920,
          "height": 1080,
          "duration": null
        },
        {
          "type": "video",
          "url": "https://res.cloudinary.com/xxx/video/upload/v1234567890/social/messages/def456.mp4",
          "thumbnail": "https://res.cloudinary.com/xxx/video/upload/v1234567890/social/messages/def456.jpg",
          "filename": "birthday-video.mp4",
          "size": 15728640,
          "format": "mp4",
          "width": 1280,
          "height": 720,
          "duration": 45.5
        },
        {
          "type": "audio",
          "url": "https://res.cloudinary.com/xxx/video/upload/v1234567890/social/messages/ghi789.mp3",
          "thumbnail": null,
          "filename": "voice-message.mp3",
          "size": 524288,
          "format": "mp3",
          "width": null,
          "height": null,
          "duration": 30.2
        },
        {
          "type": "file",
          "url": "https://res.cloudinary.com/xxx/raw/upload/v1234567890/social/messages/jkl012.pdf",
          "thumbnail": null,
          "filename": "document.pdf",
          "size": 1048576,
          "format": "pdf",
          "width": null,
          "height": null,
          "duration": null
        }
      ]
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## Frontend Integration

### 1. React/TypeScript Example

```typescript
// types.ts
export interface MessageFile {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  thumbnail: string | null;
  filename: string;
  size: number;
  format: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'VOICE' | 'FILE';
  status: 'SENT' | 'DELIVERED' | 'SEEN';
  metadata?: {
    files?: MessageFile[];
  };
  createdAt: string;
  updatedAt: string;
}

// api.ts
export async function sendMessageWithFiles(
  files: File[],
  content: string,
  receiverId?: string,
  groupId?: string
): Promise<Message> {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  if (content) formData.append('content', content);
  if (receiverId) formData.append('receiverId', receiverId);
  if (groupId) formData.append('groupId', groupId);

  const response = await fetch('http://localhost:5000/api/v1/messages/with-files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const result = await response.json();
  return result.data;
}

// MessageInput.tsx
import React, { useState } from 'react';

export function MessageInput({ receiverId, groupId }: { receiverId?: string; groupId?: string }) {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 5);
      setFiles(selectedFiles);
    }
  };

  const handleSend = async () => {
    if (!content && files.length === 0) return;

    setUploading(true);
    try {
      if (files.length > 0) {
        await sendMessageWithFiles(files, content, receiverId, groupId);
      } else {
        // Send text-only message via regular endpoint
      }
      setContent('');
      setFiles([]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="message-input">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        disabled={uploading}
      />
      
      <input
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.csv"
        onChange={handleFileSelect}
        disabled={uploading}
        style={{ display: 'none' }}
        id="file-input"
      />
      
      <label htmlFor="file-input">
        📎 Attach Files ({files.length}/5)
      </label>
      
      <button onClick={handleSend} disabled={uploading}>
        {uploading ? 'Sending...' : 'Send'}
      </button>
      
      {files.length > 0 && (
        <div className="file-preview">
          {files.map((file, idx) => (
            <div key={idx} className="file-item">
              {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 2. File Preview Components

```typescript
// FilePreview.tsx
import React from 'react';
import { MessageFile } from './types';

export function FilePreview({ file }: { file: MessageFile }) {
  switch (file.type) {
    case 'image':
      return (
        <div className="image-preview">
          <img 
            src={file.thumbnail || file.url} 
            alt={file.filename}
            onClick={() => window.open(file.url, '_blank')}
            style={{ cursor: 'pointer', maxWidth: '300px', borderRadius: '8px' }}
          />
          <p className="filename">{file.filename}</p>
        </div>
      );

    case 'video':
      return (
        <div className="video-preview">
          <video 
            controls 
            poster={file.thumbnail || undefined}
            style={{ maxWidth: '400px', borderRadius: '8px' }}
          >
            <source src={file.url} type={`video/${file.format}`} />
          </video>
          <p className="filename">{file.filename}</p>
          <p className="duration">Duration: {file.duration?.toFixed(1)}s</p>
        </div>
      );

    case 'audio':
      return (
        <div className="audio-preview">
          <audio controls style={{ width: '100%' }}>
            <source src={file.url} type={`audio/${file.format}`} />
          </audio>
          <p className="filename">🎵 {file.filename}</p>
          <p className="duration">Duration: {file.duration?.toFixed(1)}s</p>
        </div>
      );

    case 'file':
      return (
        <div className="file-preview">
          <a href={file.url} download={file.filename} className="file-download">
            📄 {file.filename}
          </a>
          <p className="filesize">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      );

    default:
      return null;
  }
}

// MessageBubble.tsx
export function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`message-bubble ${message.senderId === currentUserId ? 'sent' : 'received'}`}>
      {message.content && <p className="message-text">{message.content}</p>}
      
      {message.metadata?.files && (
        <div className="message-files">
          {message.metadata.files.map((file, idx) => (
            <FilePreview key={idx} file={file} />
          ))}
        </div>
      )}
      
      <span className="message-time">
        {new Date(message.createdAt).toLocaleTimeString()}
      </span>
    </div>
  );
}
```

### 3. File Validation

```typescript
// validation.ts
export const FILE_LIMITS = {
  maxFiles: 5,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxVideoSize: 50 * 1024 * 1024, // 50MB
  maxAudioSize: 25 * 1024 * 1024, // 25MB
  maxFileSize: 25 * 1024 * 1024,  // 25MB
};

export const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/avi'],
  audio: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
};

export function validateFiles(files: File[]): { valid: boolean; error?: string } {
  if (files.length > FILE_LIMITS.maxFiles) {
    return { valid: false, error: `Maximum ${FILE_LIMITS.maxFiles} files allowed` };
  }

  for (const file of files) {
    const isImage = ALLOWED_TYPES.image.includes(file.type);
    const isVideo = ALLOWED_TYPES.video.includes(file.type);
    const isAudio = ALLOWED_TYPES.audio.includes(file.type);
    const isDocument = ALLOWED_TYPES.document.includes(file.type);

    if (!isImage && !isVideo && !isAudio && !isDocument) {
      return { valid: false, error: `Unsupported file type: ${file.type}` };
    }

    if (isImage && file.size > FILE_LIMITS.maxImageSize) {
      return { valid: false, error: `Image ${file.name} exceeds 10MB limit` };
    }

    if (isVideo && file.size > FILE_LIMITS.maxVideoSize) {
      return { valid: false, error: `Video ${file.name} exceeds 50MB limit` };
    }

    if ((isAudio || isDocument) && file.size > FILE_LIMITS.maxFileSize) {
      return { valid: false, error: `File ${file.name} exceeds 25MB limit` };
    }
  }

  return { valid: true };
}
```

---

## WebSocket Integration

When a message with files is sent, the WebSocket gateway will emit the same message structure to all participants:

```typescript
// Listen for new messages
socket.on('message:new', (message: Message) => {
  if (message.metadata?.files) {
    // Handle message with files
    console.log('Received message with files:', message.metadata.files);
  }
});
```

---

## Error Handling

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | `NO_FILES_PROVIDED` | No files were uploaded |
| 400 | `UNSUPPORTED_MEDIA_TYPE` | File type not allowed |
| 400 | `FILE_TOO_LARGE` | File exceeds size limit |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 413 | `PAYLOAD_TOO_LARGE` | Total request size exceeds limit |
| 503 | `UPLOAD_NOT_CONFIGURED` | Cloudinary not configured |

---

## Performance Tips

1. **Show upload progress**: Use `XMLHttpRequest` or `axios` with progress events
2. **Compress images client-side**: Use libraries like `browser-image-compression`
3. **Lazy load media**: Only load full-size images/videos when clicked
4. **Cache thumbnails**: Store thumbnail URLs in local state
5. **Optimize video**: Encourage users to upload compressed videos

---

## Testing with cURL

```bash
# Send image
curl -X POST http://localhost:5000/api/v1/messages/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/image.jpg" \
  -F "content=Check this out!" \
  -F "receiverId=USER_ID"

# Send multiple files
curl -X POST http://localhost:5000/api/v1/messages/with-files \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/image.jpg" \
  -F "files=@/path/to/video.mp4" \
  -F "files=@/path/to/document.pdf" \
  -F "content=Multiple files" \
  -F "groupId=GROUP_ID"
```

---

## Next Steps

1. Implement file preview in your frontend
2. Add drag-and-drop file upload
3. Show upload progress indicators
4. Add file compression before upload
5. Implement file download tracking
