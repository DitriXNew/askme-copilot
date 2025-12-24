// Types and interfaces for Ask Me Copilot Tool

export interface IAskExpertParameters {
    question: string;
    context?: string;
    previousAnswer?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface ISelectFromListParameters {
    question: string;
    options: string[];
    multiSelect?: boolean;
    defaultSelection?: number;
    context?: string;
}

export interface IReviewCodeParameters {
    code: string;
    language: string;
    question?: string;
    focusAreas?: string[];
}

export interface IExpertResponse {
    text: string;
    attachments: IAttachment[];
}

export interface IAttachment {
    data: string | null; // base64 encoded, null for file paths
    mimeType: string;
    name: string;
    filePath?: string; // Path to file (for non-image attachments)
    isFilePath?: boolean; // True if this is a file path reference, not image data
}

export interface IConfirmActionParameters {
    action: string;
    details?: string;
}

export interface IReadImageParameters {
    filePath: string;
    description?: string;
    /** Quality 1-100. 100 = no compression (default), lower = more compression */
    quality?: number;
    /** Max width in pixels. Image will be resized if larger */
    maxWidth?: number;
    /** Max height in pixels. Image will be resized if larger */
    maxHeight?: number;
}

export type Priority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationStyle = 'subtle' | 'normal' | 'prominent';

// Expert Monitor types
export interface IMonitorMessage {
    id: string;
    text: string;
    timestamp: number;
    status: 'pending' | 'delivered';
    attachments?: IAttachment[];
}

export interface ICheckTaskStatusParameters {
    /** Optional reason for checking status */
    reason?: string;
}

export interface IMonitorStatus {
    /** Whether pause is active - Copilot should wait */
    isPaused: boolean;
    /** Whether expert wants to be consulted */
    shouldAskExpert: boolean;
    /** Pending messages from expert */
    messages: IMonitorMessage[];
    /** Summary for Copilot */
    summary: string;
}

// Response Templates types
export interface IResponseTemplate {
    /** Template title (max 30 characters) */
    title: string;
    /** Template content (max 500 characters) */
    content: string;
    /** Whether this template is enabled by default */
    enabledByDefault: boolean;
    /** Which tools can use this template */
    applyTo: {
        askExpert: boolean;
        selectFromList: boolean;
        reviewCode: boolean;
    };
}
