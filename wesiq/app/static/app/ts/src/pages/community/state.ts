export interface tag {
    tagged_user?:string, // Stores The Tagged User Only If The At Sign Represents The Tag And Isn't Just An Ordinary Symbol

    position: {
        tag_start_index:number, // Stores The Starting Position
        tag_end_index:number // Stores The Ending Position
    }
}

export interface hashtag {
    added_hashtag?:string, // Stores The Added Hashtag Only If The Hash Sign Represents The Hashtag And Isn't Just An Ordinary Symbol

    position: {
        hashtag_start_index:number, // Stores The Starting Position
        hashtag_end_index:number // Stores The Ending Position
    }
}

export const posts_preview_state:{
    current_files:File[],
    MAX_IMAGE_SIZE:number,
    MAX_VIDEO_SIZE:number,
    MAX_VIDEO_DURATION:number,
    MIN_VIDEO_DURATION:number
} = {
    current_files: [], // Stores Current Selected Files
    MAX_IMAGE_SIZE: 10 * 1000 * 1000, // 10MB
    MAX_VIDEO_SIZE: 1000 * 1000 * 500, // 500MB
    MAX_VIDEO_DURATION: 60 * 20, // 20 Minutes
    MIN_VIDEO_DURATION: 1 // 1 Second
}

export const tag_user_state:{
    MAX_HISTORY_LENGTH:number,
    MAX_TAGGED_USERS:number,
    tagged_users:string[],
    tagged_user:string,
    focused_user_for_tag_index:number,
    tag_start_index:number,
    tag_cursor_position:number,

    tags:tag[]
} = {
    MAX_HISTORY_LENGTH: 3,
    MAX_TAGGED_USERS: 10, // Sets Maximum Amount Of Tagged Users (10 By Default)
    tagged_users: [], // Stores All Tagged Users
    tagged_user: "", // Stores The Tagged User
    focused_user_for_tag_index: 0, // Focused User For Tag Index
    tag_start_index: -1, // Stores Active Tag Start Index While Typing (Survives Dropdown Click)
    tag_cursor_position: -1, // Stores Active Tag Cursor Position While Typing (Survives Dropdown Click)

    tags: [] // Stores All Tags And Their Position Or Only The Position Of An Ordinary At Sign
}

export const add_hashtag_state:{
    MAX_ADDED_HASHTAGS:number,
    added_hashtags:string[],
    added_hashtag:string,

    hashtags:hashtag[]
} = {
    MAX_ADDED_HASHTAGS: 5, // Sets Maximum Amount Of Added Hashtags (5 By Default)
    added_hashtags: [], // Stores All Added Hashtags
    added_hashtag: "", // Stores The Added Hashtag

    hashtags: [] // Stores All Hashtags And Their Position Or Only The Position Of An Ordinary Hash Sign
}

export const location_state:{
    focused_place_index:number
} = {
    focused_place_index: 0
}

export const search_users_state:{
    MAX_HISTORY_LENGTH:number
} = {
    MAX_HISTORY_LENGTH: 3
}

export const feed_state:{
    MAX_HISTORY_LENGTH:number,
    focused_searched_post_index:number,
    current_page:number,
    is_loading:boolean,
    has_more_posts:boolean
} = {
    MAX_HISTORY_LENGTH: 3,
    focused_searched_post_index: 0, // Focused Searched Post Index
    current_page: 1, // Stores The Corrent Page
    is_loading: false, // Stores If The User Hits The Bottom Of The Feed
    has_more_posts: true // Stores If There Are More Posts
}

export const comment_input_state:{
    MAX_LENGTH:number
} = {
    MAX_LENGTH:100
}