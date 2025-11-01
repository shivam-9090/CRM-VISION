import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Parser } from '@json2csv/plainjs';

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export contacts to CSV format
   */
  async exportContacts(companyId: string): Promise<string> {
    const contacts = await this.prisma.contact.findMany({
      where: { companyId },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'First Name', value: 'firstName' },
      { label: 'Last Name', value: 'lastName' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Company', value: 'company.name' },
      { label: 'Created At', value: 'createdAt' },
      { label: 'Updated At', value: 'updatedAt' },
    ];

    const parser = new Parser({ fields });
    return parser.parse(contacts);
  }

  /**
   * Export deals to CSV format
   */
  async exportDeals(companyId: string): Promise<string> {
    const deals = await this.prisma.deal.findMany({
      where: { companyId },
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
      orderBy: { createdAt: 'desc' },
    });

    const formattedDeals = deals.map((deal) => ({
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
    }));

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Value', value: 'value' },
      { label: 'Stage', value: 'stage' },
      { label: 'Priority', value: 'priority' },
      { label: 'Expected Close Date', value: 'expectedCloseDate' },
      { label: 'Closed At', value: 'closedAt' },
      { label: 'Contact Name', value: 'contactName' },
      { label: 'Contact Email', value: 'contactEmail' },
      { label: 'Company', value: 'company' },
      { label: 'Created At', value: 'createdAt' },
      { label: 'Updated At', value: 'updatedAt' },
    ];

    const parser = new Parser({ fields });
    return parser.parse(formattedDeals);
  }

  /**
   * Export activities to CSV format
   */
  async exportActivities(companyId: string): Promise<string> {
    const activities = await this.prisma.activity.findMany({
      where: { companyId },
      include: {
        contact: true,
        deal: true,
        assignedTo: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedActivities = activities.map((activity: any) => ({
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
    }));

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Title', value: 'title' },
      { label: 'Description', value: 'description' },
      { label: 'Type', value: 'type' },
      { label: 'Status', value: 'status' },
      { label: 'Scheduled Date', value: 'scheduledDate' },
      { label: 'Contact Name', value: 'contactName' },
      { label: 'Contact Email', value: 'contactEmail' },
      { label: 'Deal Title', value: 'dealTitle' },
      { label: 'Assigned To', value: 'assignedToName' },
      { label: 'Assigned Email', value: 'assignedToEmail' },
      { label: 'Created At', value: 'createdAt' },
      { label: 'Updated At', value: 'updatedAt' },
    ];

    const parser = new Parser({ fields });
    return parser.parse(formattedActivities);
  }

  /**
   * Export companies to CSV format
   */
  async exportCompanies(companyId: string): Promise<string> {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return '';
    }

    const formattedCompany = {
      id: company.id,
      name: company.name,
      description: company.description || '',
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };

    const fields = [
      { label: 'ID', value: 'id' },
      { label: 'Name', value: 'name' },
      { label: 'Description', value: 'description' },
      { label: 'Created At', value: 'createdAt' },
      { label: 'Updated At', value: 'updatedAt' },
    ];

    const parser = new Parser({ fields });
    return parser.parse([formattedCompany]);
  }
}
