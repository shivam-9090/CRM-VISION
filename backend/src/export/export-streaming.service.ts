import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AsyncParser } from '@json2csv/node';
import { Readable } from 'stream';
import * as ExcelJS from 'exceljs';

export interface ExportOptions {
  fields?: string[];
  startDate?: Date;
  endDate?: Date;
  format?: 'csv' | 'excel' | 'json' | 'xml';
}

@Injectable()
export class ExportStreamingService {
  private readonly logger = new Logger(ExportStreamingService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Export contacts as a stream (handles large datasets efficiently)
   */
  async *streamContacts(
    companyId: string,
    options: ExportOptions = {},
  ): AsyncGenerator<any> {
    const { startDate, endDate } = options;

    const batchSize = 1000;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const contacts = await this.prisma.contact.findMany({
        where: {
          companyId,
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: {
          company: {
            select: {
              name: true,
            },
          },
        },
        skip,
        take: batchSize,
        orderBy: { createdAt: 'desc' },
      });

      if (contacts.length === 0) {
        hasMore = false;
        break;
      }

      for (const contact of contacts) {
        yield {
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company.name,
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
        };
      }

      skip += batchSize;
      hasMore = contacts.length === batchSize;
    }
  }

  /**
   * Export deals as a stream
   */
  async *streamDeals(
    companyId: string,
    options: ExportOptions = {},
  ): AsyncGenerator<any> {
    const { startDate, endDate } = options;

    const batchSize = 1000;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const deals = await this.prisma.deal.findMany({
        where: {
          companyId,
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: {
          contact: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          company: {
            select: {
              name: true,
            },
          },
        },
        skip,
        take: batchSize,
        orderBy: { createdAt: 'desc' },
      });

      if (deals.length === 0) {
        hasMore = false;
        break;
      }

      for (const deal of deals) {
        yield {
          id: deal.id,
          title: deal.title,
          value: deal.value ? deal.value.toString() : '0',
          stage: deal.stage,
          priority: deal.priority,
          expectedCloseDate: deal.expectedCloseDate,
          closedAt: deal.closedAt,
          contactName: deal.contact
            ? `${deal.contact.firstName} ${deal.contact.lastName}`
            : '',
          contactEmail: deal.contact?.email || '',
          company: deal.company.name,
          createdAt: deal.createdAt,
          updatedAt: deal.updatedAt,
        };
      }

      skip += batchSize;
      hasMore = deals.length === batchSize;
    }
  }

  /**
   * Export activities as a stream
   */
  async *streamActivities(
    companyId: string,
    options: ExportOptions = {},
  ): AsyncGenerator<any> {
    const { startDate, endDate } = options;

    const batchSize = 1000;
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const activities = await this.prisma.activity.findMany({
        where: {
          companyId,
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {}),
                },
              }
            : {}),
        },
        include: {
          contact: true,
          deal: true,
          assignedTo: true,
        },
        skip,
        take: batchSize,
        orderBy: { createdAt: 'desc' },
      });

      if (activities.length === 0) {
        hasMore = false;
        break;
      }

      for (const activity of activities) {
        yield {
          id: activity.id,
          title: activity.title,
          description: activity.description || '',
          type: activity.type,
          status: activity.status,
          scheduledDate: activity.scheduledDate,
          contactName: activity.contact
            ? `${activity.contact.firstName} ${activity.contact.lastName}`
            : '',
          contactEmail: activity.contact?.email || '',
          dealTitle: activity.deal?.title || '',
          assignedToName: activity.assignedTo?.name || '',
          assignedToEmail: activity.assignedTo?.email || '',
          createdAt: activity.createdAt,
          updatedAt: activity.updatedAt,
        };
      }

      skip += batchSize;
      hasMore = activities.length === batchSize;
    }
  }

  /**
   * Convert async generator to CSV stream
   */
  async createCSVStream(
    dataGenerator: AsyncGenerator<any>,
    fields: { label: string; value: string }[],
  ): Promise<Readable> {
    const parser = new AsyncParser({ fields });
    const readable = new Readable({
      async read() {
        try {
          for await (const data of dataGenerator) {
            const csv = await parser.parse(data).promise();
            this.push(csv + '\n');
          }
          this.push(null); // End stream
        } catch (error) {
          this.destroy(error);
        }
      },
    });

    return readable;
  }

  /**
   * Convert async generator to Excel workbook
   */
  async createExcelWorkbook(
    dataGenerator: AsyncGenerator<any>,
    fields: { label: string; value: string }[],
    sheetName: string,
  ): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add headers
    worksheet.columns = fields.map((field) => ({
      header: field.label,
      key: field.value,
      width: 15,
    }));

    // Add data rows
    for await (const data of dataGenerator) {
      worksheet.addRow(data);
    }

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook;
  }

  /**
   * Convert async generator to JSON array
   */
  async createJSONArray(dataGenerator: AsyncGenerator<any>): Promise<any[]> {
    const results: any[] = [];
    for await (const data of dataGenerator) {
      results.push(data);
    }
    return results;
  }

  /**
   * Convert async generator to XML string
   */
  async createXMLString(
    dataGenerator: AsyncGenerator<any>,
    rootElement: string,
    itemElement: string,
  ): Promise<string> {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    for await (const data of dataGenerator) {
      xml += `  <${itemElement}>\n`;
      for (const [key, value] of Object.entries(data)) {
        const escapedValue = String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        xml += `    <${key}>${escapedValue}</${key}>\n`;
      }
      xml += `  </${itemElement}>\n`;
    }

    xml += `</${rootElement}>`;
    return xml;
  }

  /**
   * Generate CSV from array (for export queue processor)
   */
  async generateCSV(data: any[]): Promise<string> {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header];
        // Handle values that contain commas, quotes, or newlines
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        if (
          stringValue.includes(',') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Generate Excel from array (for export queue processor)
   */
  async generateExcel(data: any[], sheetName: string): Promise<Buffer> {
    if (!data || data.length === 0) {
      const emptyWorkbook = new ExcelJS.Workbook();
      emptyWorkbook.addWorksheet(sheetName);
      return Buffer.from(await emptyWorkbook.xlsx.writeBuffer());
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Get headers from first row
    const headers = Object.keys(data[0]);

    // Add headers
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: 15,
    }));

    // Add data rows
    for (const row of data) {
      worksheet.addRow(row);
    }

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  /**
   * Generate JSON from array (for export queue processor)
   */
  async generateJSON(data: any[]): Promise<string> {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Generate XML from array (for export queue processor)
   */
  async generateXML(data: any[], entityType: string): Promise<string> {
    const rootElement = `${entityType}_export`;
    const itemElement = entityType.slice(0, -1); // Remove 's' to get singular form

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    for (const item of data) {
      xml += `  <${itemElement}>\n`;
      for (const [key, value] of Object.entries(item)) {
        const escapedValue = String(value ?? '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
        xml += `    <${key}>${escapedValue}</${key}>\n`;
      }
      xml += `  </${itemElement}>\n`;
    }

    xml += `</${rootElement}>`;
    return xml;
  }
}
