export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    user_id: string
                    title: string | null
                    prompt: string
                    reference_image_url: string | null
                    selected_concept: any | null
                    shot_count: number
                    total_length: number
                    hero_image_url: string | null
                    workflow_step: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title?: string | null
                    prompt: string
                    reference_image_url?: string | null
                    selected_concept?: any | null
                    shot_count?: number
                    total_length?: number
                    hero_image_url?: string | null
                    workflow_step?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string | null
                    prompt?: string
                    reference_image_url?: string | null
                    selected_concept?: any | null
                    shot_count?: number
                    total_length?: number
                    hero_image_url?: string | null
                    workflow_step?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            scenes: {
                Row: {
                    id: string
                    project_id: string
                    shot_number: number
                    description: string
                    start_frame_desc: string
                    end_frame_desc: string
                    duration: string
                    image_url: string | null
                    video_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    shot_number: number
                    description: string
                    start_frame_desc: string
                    end_frame_desc: string
                    duration: string
                    image_url?: string | null
                    video_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    shot_number?: number
                    description?: string
                    start_frame_desc?: string
                    end_frame_desc?: string
                    duration?: string
                    image_url?: string | null
                    video_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            generations: {
                Row: {
                    id: string
                    project_id: string
                    scene_id: string | null
                    type: string
                    status: string
                    model_used: string | null
                    prompt: string | null
                    result_data: any | null
                    error_message: string | null
                    created_at: string
                    completed_at: string | null
                }
                Insert: {
                    id?: string
                    project_id: string
                    scene_id?: string | null
                    type: string
                    status?: string
                    model_used?: string | null
                    prompt?: string | null
                    result_data?: any | null
                    error_message?: string | null
                    created_at?: string
                    completed_at?: string | null
                }
                Update: {
                    id?: string
                    project_id?: string
                    scene_id?: string | null
                    type?: string
                    status?: string
                    model_used?: string | null
                    prompt?: string | null
                    result_data?: any | null
                    error_message?: string | null
                    created_at?: string
                    completed_at?: string | null
                }
            }
            assets: {
                Row: {
                    id: string
                    generation_id: string | null
                    type: string
                    storage_path: string
                    url: string
                    metadata: any | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    generation_id?: string | null
                    type: string
                    storage_path: string
                    url: string
                    metadata?: any | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    generation_id?: string | null
                    type?: string
                    storage_path?: string
                    url?: string
                    metadata?: any | null
                    created_at?: string
                }
            }
        }
        Views: {}
        Functions: {}
        Enums: {}
    }
}