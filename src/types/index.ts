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
        questionnaire: boolean;
    };
}

// Questionnaire types
export type QuestionnaireFieldType = 'text' | 'checkbox' | 'radio' | 'select' | 'number' | 'textarea';

export interface IQuestionnaireField {
    /** Field type */
    type: QuestionnaireFieldType;
    /** Unique field name for result mapping */
    name: string;
    /** Display label */
    label: string;
    /** Placeholder text */
    placeholder?: string;
    /** Default value */
    defaultValue?: string | number | boolean;
    /** Options for radio/select fields */
    options?: string[];
    /** Conditional display - show when another field has specific value */
    showWhen?: { field: string; value: string | number | boolean };
}

export interface IQuestionnaireSection {
    /** Section title */
    title: string;
    /** Section description */
    description?: string;
    /** Fields in this section */
    fields: IQuestionnaireField[];
}

export interface IQuestionnaireParameters {
    /** Questionnaire title */
    title: string;
    /** Questionnaire description */
    description?: string;
    /** Sections with fields */
    sections: IQuestionnaireSection[];
}

export interface IQuestionnaireResult {
    /** Field values by name */
    values: Record<string, string | number | boolean>;
    /** Field-specific comments by field name */
    fieldComments?: Record<string, string>;
    /** Expert's additional comment */
    comment?: string;
    /** Attachments */
    attachments?: IAttachment[];
}

export type StructFileFormat = 'json' | 'jsonc' | 'xml';
export type StructQueryLanguage = 'jsonpath' | 'xpath';
export type StructQueryReturnMode = 'values' | 'paths' | 'count' | 'paths+values';
export type StructSchemaType = 'json_schema' | 'xsd' | 'dtd' | 'relaxng';
export type StructDiagnosticKind = 'duplicate-key' | 'unsafe-integer' | 'unicode-escape-risk';
export type StructMutationAction =
    | 'set'
    | 'insert'
    | 'delete'
    | 'rename'
    | 'move'
    | 'copy'
    | 'set_attribute'
    | 'delete_attribute';

export interface IStructInspectParameters {
    filePath: string;
    depth?: number;
    path?: string;
    namespaces?: Record<string, string>;
}

export interface IStructQueryParameters {
    filePath: string;
    expression: string;
    language?: StructQueryLanguage;
    namespaces?: Record<string, string>;
    limit?: number;
    return?: StructQueryReturnMode;
}

export interface IStructMutateOperation {
    action: StructMutationAction;
    target: string;
    value?: unknown;
    position?: string;
    bulk?: boolean;
    namespaces?: Record<string, string>;
    destination?: string;
    attribute?: string;
}

export interface IStructMutateParameters {
    filePath: string;
    operations: IStructMutateOperation[];
    bulk?: boolean;
}

export interface IStructValidateParameters {
    filePath: string;
    schema?: unknown;
    schemaType?: StructSchemaType;
}

export interface IStructDiffParameters {
    filePathBefore: string;
    filePathAfter: string;
    ignoreWhitespace?: boolean;
}

export interface IStructDiagnostic {
    kind: StructDiagnosticKind;
    severity: 'warning';
    message: string;
    path?: string;
    offset?: number;
    length?: number;
    line?: number;
    column?: number;
    keyName?: string;
    source?: 'key' | 'value';
    valuePreview?: string;
}
