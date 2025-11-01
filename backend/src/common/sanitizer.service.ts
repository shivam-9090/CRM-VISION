import { Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizerService {
  /**
   * Sanitize plain text - removes all HTML tags
   * Use for: titles, names, short text fields
   */
  sanitizeText(text: string | null | undefined): string | null {
    if (!text) return null;
    
    return sanitizeHtml(text, {
      allowedTags: [], // No HTML tags allowed
      allowedAttributes: {},
      disallowedTagsMode: 'escape', // Escape instead of remove
    });
  }

  /**
   * Sanitize rich text - allows safe formatting tags
   * Use for: descriptions, notes, long text fields
   */
  sanitizeRichText(text: string | null | undefined): string | null {
    if (!text) return null;
    
    // Allow safe formatting tags only
    return sanitizeHtml(text, {
      allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      allowedAttributes: {
        'a': ['href', 'title'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      // Remove any script tags or dangerous attributes
      disallowedTagsMode: 'discard',
    });
  }

  /**
   * Sanitize array of strings
   */
  sanitizeArray(items: string[] | null | undefined): string[] | null {
    if (!items || !Array.isArray(items)) return null;
    
    return items.map(item => this.sanitizeText(item)).filter(Boolean) as string[];
  }

  /**
   * Sanitize object properties recursively
   * @param obj - Object to sanitize
   * @param fieldsToSanitize - Array of field names to sanitize
   * @returns Sanitized object
   */
  sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    fieldsToSanitize: (keyof T)[],
  ): T {
    const sanitized = { ...obj };

    for (const field of fieldsToSanitize) {
      const value = sanitized[field];
      if (value && typeof value === 'string') {
        sanitized[field] = (this.sanitizeText(value) ?? undefined) as T[keyof T];
      }
    }

    return sanitized;
  }
}
