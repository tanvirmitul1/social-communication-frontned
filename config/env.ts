/**
 * Environment configuration
 * Centralized place for all environment variables
 */

export const env = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000",
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001",
  },
  auth: {
    nextAuthUrl: process.env.NEXTAUTH_URL || "http://localhost:3001",
    nextAuthSecret: process.env.NEXTAUTH_SECRET || "",
  },
  jitsi: {
    domain: process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jitsi.com",
    appId: process.env.NEXT_PUBLIC_JITSI_APP_ID || "",
    appSecret: process.env.JITSI_APP_SECRET || "",
  },
  upload: {
    uploadthingAppId: process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID || "",
    uploadthingSecret: process.env.UPLOADTHING_SECRET || "",
    cloudinaryCloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    cloudinaryUploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "",
  },
  features: {
    enableVoiceMessages: process.env.NEXT_PUBLIC_ENABLE_VOICE_MESSAGES === "true",
    enableVideoCalls: process.env.NEXT_PUBLIC_ENABLE_VIDEO_CALLS === "true",
    enableFileUpload: process.env.NEXT_PUBLIC_ENABLE_FILE_UPLOAD === "true",
  },
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;
