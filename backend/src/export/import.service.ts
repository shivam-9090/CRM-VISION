import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import csv from 'csv-parser';
import { Readable } from 'stream';
import {
  DealStage,
  Priority,
  ActivityType,
  ActivityStatus,
} from '@prisma/client';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Import contacts from CSV
   */
  async importContacts(
    csvContent: string,
    companyId: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const rows: any[] = await this.parseCSV(csvContent);

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row['First Name'] || !row['Last Name'] || !row['Email']) {
          result.failed++;
          result.errors.push(
            `Row skipped: Missing required fields (First Name, Last Name, or Email)`,
          );
          continue;
        }

        // Check if contact already exists
        const existingContact = await this.prisma.contact.findFirst({
          where: {
            email: row['Email'],
            companyId,
          },
        });

        if (existingContact) {
          result.failed++;
          result.errors.push(
            `Contact with email ${row['Email']} already exists`,
          );
          continue;
        }

        // Create contact
        await this.prisma.contact.create({
          data: {
            firstName: row['First Name'],
            lastName: row['Last Name'],
            email: row['Email'],
            phone: row['Phone'] || null,
            companyId,
          },
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error importing contact ${row['Email']}: ${error.message}`,
        );
      }
    }

    return result;
  }

  /**
   * Import deals from CSV
   */
  async importDeals(
    csvContent: string,
    companyId: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const rows: any[] = await this.parseCSV(csvContent);

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row['Title']) {
          result.failed++;
          result.errors.push(`Row skipped: Missing required field (Title)`);
          continue;
        }

        // Validate stage
        const stage = row['Stage'] as DealStage;
        if (
          stage &&
          ![
            'LEAD',
            'QUALIFIED',
            'NEGOTIATION',
            'CLOSED_WON',
            'CLOSED_LOST',
          ].includes(stage)
        ) {
          result.failed++;
          result.errors.push(
            `Invalid stage for deal ${row['Title']}: ${stage}`,
          );
          continue;
        }

        // Validate priority
        const priority = row['Priority'] as Priority;
        if (
          priority &&
          !['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)
        ) {
          result.failed++;
          result.errors.push(
            `Invalid priority for deal ${row['Title']}: ${priority}`,
          );
          continue;
        }

        // Find contact by email if provided
        let contactId: string | null = null;
        if (row['Contact Email']) {
          const contact = await this.prisma.contact.findFirst({
            where: {
              email: row['Contact Email'],
              companyId,
            },
          });
          contactId = contact?.id || null;
        }

        // Create deal - prepare date fields separately to avoid Prisma parsing issues
        let expectedCloseDateValue: Date | null = null;
        if (row['Expected Close Date']) {
          expectedCloseDateValue = new Date(row['Expected Close Date']);
        }

        let closedAtValue: Date | null = null;
        if (row['Closed At']) {
          closedAtValue = new Date(row['Closed At']);
        }

        await this.prisma.deal.create({
          data: {
            title: row['Title'],
            value: row['Value'] ? parseFloat(row['Value']) : 0,
            stage: stage || 'LEAD',
            priority: priority || 'MEDIUM',
            expectedCloseDate: expectedCloseDateValue,
            closedAt: closedAtValue,
            contactId,
            companyId,
          },
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error importing deal ${row['Title']}: ${error.message}`,
        );
      }
    }

    return result;
  }

  /**
   * Import activities from CSV
   */
  async importActivities(
    csvContent: string,
    companyId: string,
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    const rows: any[] = await this.parseCSV(csvContent);

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row['Title'] || !row['Scheduled Date']) {
          result.failed++;
          result.errors.push(
            `Row skipped: Missing required fields (Title or Scheduled Date)`,
          );
          continue;
        }

        // Validate type
        const type = row['Type'] as ActivityType;
        if (
          type &&
          !['CALL', 'MEETING', 'TASK', 'EMAIL', 'NOTE'].includes(type)
        ) {
          result.failed++;
          result.errors.push(
            `Invalid type for activity ${row['Title']}: ${type}`,
          );
          continue;
        }

        // Validate status
        const status = row['Status'] as ActivityStatus;
        if (
          status &&
          !['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)
        ) {
          result.failed++;
          result.errors.push(
            `Invalid status for activity ${row['Title']}: ${status}`,
          );
          continue;
        }

        // Find contact by email if provided
        let contactId: string | null = null;
        if (row['Contact Email']) {
          const contact = await this.prisma.contact.findFirst({
            where: {
              email: row['Contact Email'],
              companyId,
            },
          });
          contactId = contact?.id || null;
        }

        // Find deal by title if provided
        let dealId: string | null = null;
        if (row['Deal Title']) {
          const deal = await this.prisma.deal.findFirst({
            where: {
              title: row['Deal Title'],
              companyId,
            },
          });
          dealId = deal?.id || null;
        }

        // Find assigned user by email if provided
        let assignedToId: string | null = null;
        if (row['Assigned Email']) {
          const user = await this.prisma.user.findFirst({
            where: {
              email: row['Assigned Email'],
              companyId,
            },
          });
          assignedToId = user?.id || null;
        }

        // Create activity
        const activityData: any = {
          title: row['Title'],
          description: row['Description'] || null,
          type: type || 'TASK',
          status: status || 'SCHEDULED',
          scheduledDate: new Date(row['Scheduled Date']),
          companyId,
        };

        if (dealId) {
          activityData.dealId = dealId;
        }

        if (assignedToId) {
          activityData.assignedToId = assignedToId;
        }

        await this.prisma.activity.create({
          data: activityData,
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Error importing activity ${row['Title']}: ${error.message}`,
        );
      }
    }

    return result;
  }

  /**
   * Parse CSV content into array of objects
   */
  private async parseCSV(csvContent: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const rows: any[] = [];
      const stream = Readable.from([csvContent]);

      stream
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows))
        .on('error', (error) => reject(error));
    });
  }
}
