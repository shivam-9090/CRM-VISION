import { Injectable, Logger } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EmailTemplate } from './interfaces/email.interface';

@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);
  private readonly templatesDir = path.join(__dirname, 'templates');
  private compiledTemplates = new Map<string, Handlebars.TemplateDelegate>();

  constructor() {
    void this.registerHelpers();
  }

  /**
   * Register Handlebars helpers for common formatting tasks
   */
  private registerHelpers() {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: Date, format?: string) => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'short') {
        return d.toLocaleDateString();
      }
      return d.toLocaleString();
    });

    // Currency helper
    Handlebars.registerHelper(
      'currency',
      (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(amount);
      },
    );

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str?.toUpperCase() || '';
    });

    // Lowercase helper
    Handlebars.registerHelper('lowercase', (str: string) => {
      return str?.toLowerCase() || '';
    });

    // Conditional helper for equality
    Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    });

    this.logger.log('Handlebars helpers registered successfully');
  }

  /**
   * Compile and cache a template
   */
  private async compileTemplate(
    templateName: string,
    format: 'html' | 'text',
  ): Promise<Handlebars.TemplateDelegate> {
    const cacheKey = `${templateName}.${format}`;

    // Return cached template if available
    if (this.compiledTemplates.has(cacheKey)) {
      return this.compiledTemplates.get(cacheKey)!;
    }

    try {
      const extension = format === 'html' ? 'hbs' : 'txt';
      const templatePath = path.join(
        this.templatesDir,
        `${templateName}.${extension}`,
      );

      this.logger.log(`Loading template: ${templatePath}`);

      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const compiled = Handlebars.compile(templateContent);

      // Cache the compiled template
      this.compiledTemplates.set(cacheKey, compiled);

      this.logger.log(`Template compiled and cached: ${cacheKey}`);
      return compiled;
    } catch (error) {
      this.logger.error(`Failed to compile template: ${templateName}`, error);
      throw new Error(`Template not found: ${templateName}`);
    }
  }

  /**
   * Render a template with the provided context
   */
  async render(
    template: EmailTemplate,
    context: Record<string, any>,
    format: 'html' | 'text' = 'html',
  ): Promise<string> {
    try {
      const compiled = await this.compileTemplate(template, format);
      const rendered = compiled(context);

      this.logger.log(
        `Template rendered successfully: ${template}.${format}`,
      );
      return rendered;
    } catch (error) {
      this.logger.error(
        `Failed to render template: ${template}.${format}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Render both HTML and text versions of a template
   */
  async renderBoth(
    template: EmailTemplate,
    context: Record<string, any>,
  ): Promise<{ html: string; text: string }> {
    const [html, text] = await Promise.all([
      this.render(template, context, 'html'),
      this.render(template, context, 'text'),
    ]);

    return { html, text };
  }

  /**
   * Clear template cache (useful for development/testing)
   */
  clearCache(): void {
    this.compiledTemplates.clear();
    this.logger.log('Template cache cleared');
  }

  /**
   * Get list of available templates
   */
  async getAvailableTemplates(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templates = files
        .filter((file) => file.endsWith('.hbs'))
        .map((file) => file.replace('.hbs', ''));

      return [...new Set(templates)]; // Remove duplicates
    } catch (error) {
      this.logger.error('Failed to list templates', error);
      return [];
    }
  }
}
