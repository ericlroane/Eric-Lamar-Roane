export enum ChatAuthor {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system',
}

export interface GroundingSource {
  uri: string;
  title: string;
  type: 'web' | 'maps';
}

export interface ChatMessage {
  author: ChatAuthor;
  content: string;
  groundingSources?: GroundingSource[];
}

export interface SubscriptionTier {
  name: string;
  price: string;
  features: string[];
  isFeatured: boolean;
}