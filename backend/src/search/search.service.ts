import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  type: 'contact' | 'deal' | 'company' | 'activity';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  relevance?: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  /**
   * Global search across all CRM entities
   * @param query - Search query string
   * @param types - Array of entity types to search (defaults to all)
   * @param companyId - Company ID for data scoping
   * @param limit - Maximum results per entity type (default 10)
   */
  async globalSearch(
    query: string,
    companyId: string,
    types: Array<'contact' | 'deal' | 'company' | 'activity'> = [
      'contact',
      'deal',
      'company',
      'activity',
    ],
    limit = 10,
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchTerm = query.trim();
    const results: SearchResult[] = [];

    // Search in parallel for better performance
    const searchPromises: Promise<void>[] = [];

    // Search Contacts
    if (types.includes('contact')) {
      searchPromises.push(
        this.searchContacts(searchTerm, companyId, limit).then((contacts) => {
          results.push(...contacts);
        }),
      );
    }

    // Search Deals
    if (types.includes('deal')) {
      searchPromises.push(
        this.searchDeals(searchTerm, companyId, limit).then((deals) => {
          results.push(...deals);
        }),
      );
    }

    // Search Companies (only if user is searching across companies)
    if (types.includes('company')) {
      searchPromises.push(
        this.searchCompanies(searchTerm, companyId).then((companies) => {
          results.push(...companies);
        }),
      );
    }

    // Search Activities
    if (types.includes('activity')) {
      searchPromises.push(
        this.searchActivities(searchTerm, companyId, limit).then(
          (activities) => {
            results.push(...activities);
          },
        ),
      );
    }

    await Promise.all(searchPromises);

    // Sort by relevance (basic implementation - can be enhanced)
    return this.sortByRelevance(results);
  }

  /**
   * Search contacts by name, email, phone, or company
   */
  private async searchContacts(
    query: string,
    companyId: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const contacts = await this.prisma.contact.findMany({
      where: {
        companyId,
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    return contacts.map((contact) => ({
      type: 'contact' as const,
      id: contact.id,
      title: `${contact.firstName} ${contact.lastName}`,
      subtitle: contact.email || undefined,
      description: contact.phone || undefined,
      metadata: {
        email: contact.email,
        phone: contact.phone,
      },
      relevance: this.calculateRelevance(
        query,
        `${contact.firstName} ${contact.lastName} ${contact.email} ${contact.phone}`,
      ),
    }));
  }

  /**
   * Search deals by title or stage
   */
  private async searchDeals(
    query: string,
    companyId: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const deals = await this.prisma.deal.findMany({
      where: {
        companyId,
        title: { contains: query, mode: 'insensitive' },
      },
      take: limit,
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        priority: true,
      },
    });

    return deals.map((deal) => ({
      type: 'deal' as const,
      id: deal.id,
      title: deal.title,
      subtitle: `${deal.stage} - $${deal.value?.toString() || '0'}`,
      description: `Priority: ${deal.priority}`,
      metadata: {
        value: deal.value?.toString(),
        stage: deal.stage,
        priority: deal.priority,
      },
      relevance: this.calculateRelevance(query, deal.title),
    }));
  }

  /**
   * Search companies by name or description
   */
  private async searchCompanies(
    query: string,
    companyId: string,
  ): Promise<SearchResult[]> {
    // For now, only search the user's own company
    // In multi-tenant scenarios, you might search partner companies
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            contacts: true,
            deals: true,
            activities: true,
          },
        },
      },
    });

    if (!company) return [];

    const matchesQuery =
      company.name.toLowerCase().includes(query.toLowerCase()) ||
      company.description?.toLowerCase().includes(query.toLowerCase());

    if (!matchesQuery) return [];

    return [
      {
        type: 'company' as const,
        id: company.id,
        title: company.name,
        subtitle: `${company._count.contacts} contacts, ${company._count.deals} deals`,
        description: company.description || undefined,
        metadata: {
          contactCount: company._count.contacts,
          dealCount: company._count.deals,
          activityCount: company._count.activities,
        },
        relevance: this.calculateRelevance(
          query,
          `${company.name} ${company.description}`,
        ),
      },
    ];
  }

  /**
   * Search activities by title, description, or type
   */
  private async searchActivities(
    query: string,
    companyId: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const activities = await this.prisma.activity.findMany({
      where: {
        companyId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        status: true,
        scheduledDate: true,
      },
    });

    return activities.map((activity) => ({
      type: 'activity' as const,
      id: activity.id,
      title: activity.title,
      subtitle: `${activity.type} - ${activity.status}`,
      description: activity.description || undefined,
      metadata: {
        type: activity.type,
        status: activity.status,
        scheduledDate: activity.scheduledDate.toISOString(),
      },
      relevance: this.calculateRelevance(
        query,
        `${activity.title} ${activity.description}`,
      ),
    }));
  }

  /**
   * Calculate relevance score for sorting
   * Higher score = more relevant
   */
  private calculateRelevance(query: string, text: string): number {
    if (!text) return 0;

    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    let score = 0;

    // Exact match gets highest score
    if (lowerText === lowerQuery) {
      score += 100;
    }

    // Starts with query gets high score
    if (lowerText.startsWith(lowerQuery)) {
      score += 50;
    }

    // Contains query gets medium score
    if (lowerText.includes(lowerQuery)) {
      score += 25;
    }

    // Word boundary match gets bonus
    const words = lowerText.split(/\s+/);
    if (words.some((word) => word.startsWith(lowerQuery))) {
      score += 15;
    }

    // Shorter text with match is more relevant
    const lengthPenalty = Math.min(text.length / 100, 10);
    score -= lengthPenalty;

    return Math.max(score, 0);
  }

  /**
   * Sort results by relevance score
   */
  private sortByRelevance(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => {
      const scoreA = a.relevance || 0;
      const scoreB = b.relevance || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Search by specific entity type
   */
  async searchByType(
    type: 'contact' | 'deal' | 'company' | 'activity',
    query: string,
    companyId: string,
    limit = 20,
  ): Promise<SearchResult[]> {
    return this.globalSearch(query, companyId, [type], limit);
  }

  /**
   * Get search suggestions (autocomplete)
   * Returns top 5 results for quick suggestions
   */
  async getSearchSuggestions(
    query: string,
    companyId: string,
  ): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    // Quick search with limit of 5 results
    const results = await this.globalSearch(query, companyId, undefined, 5);

    // Return only top 5 most relevant
    return results.slice(0, 5);
  }
}
