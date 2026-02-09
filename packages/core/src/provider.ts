import { Result } from './result';
import { SendOptions, SendResult, BaseProviderAdapter, MessageType } from './types';
import { KMsgError } from './errors';

export interface Template {
  id: string;
  code: string;
  name: string;
  content: string;
  category?: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'INSPECTION';
  buttons?: any[];
  variables?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateProvider {
  createTemplate(template: Omit<Template, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<Result<Template, KMsgError>>;
  updateTemplate(code: string, template: Partial<Omit<Template, 'id' | 'code' | 'status' | 'createdAt' | 'updatedAt'>>): Promise<Result<Template, KMsgError>>;
  deleteTemplate(code: string): Promise<Result<void, KMsgError>>;
  getTemplate(code: string): Promise<Result<Template, KMsgError>>;
  listTemplates(params?: { status?: string; page?: number; limit?: number }): Promise<Result<Template[], KMsgError>>;
}

export interface Provider {
  readonly id: string;
  readonly name: string;
  send(params: SendOptions): Promise<Result<SendResult, KMsgError>>;
}

export { BaseProviderAdapter };
