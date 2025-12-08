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
    data: string; // base64 encoded
    mimeType: string;
    name: string;
}

export interface IConfirmActionParameters {
    action: string;
    details?: string;
}

export interface IReadImageParameters {
    filePath: string;
    description?: string;
}

export type Priority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationStyle = 'subtle' | 'normal' | 'prominent';
