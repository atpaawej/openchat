export interface ComposerAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string; // Base64 data URL or text content
  previewUrl?: string;
  isImage?: boolean;
}

export interface ComposerState {
  prompt: string;
  attachments: ComposerAttachment[];
  webSearchEnabled: boolean;
  searchEngine?: string;
  reasoningEnabled: boolean;
  selectedModelId: string;
  selectedProviderId?: string;
  isSubmitting: boolean;
}

export interface ComposerSubmitPayload {
  prompt: string;
  attachments: ComposerAttachment[];
  modelId: string;
  providerId?: string;
  webSearchEnabled: boolean;
  searchEngine?: string;
  reasoningEnabled: boolean;
}

export interface ComposerProps {
  initialPrompt?: string;
  selectedModelId: string;
  selectedProviderId?: string;
  onModelChange?: (modelId: string, providerId: string) => void;
  onSubmit: (payload: ComposerSubmitPayload) => Promise<void> | void;
  onStop?: () => void;
  isGenerating?: boolean;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: (enabled: boolean) => void;
  activeSearchEngine?: string;
  reasoningEnabled?: boolean;
  onReasoningToggle?: (enabled: boolean) => void;
  activeMcpToolCount?: number;
  onMcpClick?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}
