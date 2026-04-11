export const posts_preview_state:{
    current_files:File[]
    MAX_IMAGE_SIZE:number
    MAX_VIDEO_SIZE:number
} = {
    current_files: [], // Stores Current Selected Files
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_VIDEO_SIZE: 100 * 1024 * 1024 // 100MB
}