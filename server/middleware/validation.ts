import { Request } from 'express';
import { z } from 'zod';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Sanitize user input to prevent XSS
export function sanitizeInput(data: any): any {
  if (typeof data === 'string') {
    return DOMPurify.sanitize(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInput(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitizedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitizedData[key] = sanitizeInput(value);
    }
    return sanitizedData;
  }
  return data;
}

// Base schema for API requests
const baseRequestSchema = z.object({
  body: z.unknown(),
  query: z.record(z.string().or(z.array(z.string()))),
  params: z.record(z.string()),
});

// Validate request input
export function validateInput(req: Request): void {
  try {
    baseRequestSchema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
  } catch (error) {
    throw new Error('Invalid input data');
  }
}

// Export specific validation schemas for different routes
export const userInputSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

export const postInputSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
});
