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
