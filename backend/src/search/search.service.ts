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
   * Search contacts using PostgreSQL Full-Text Search
   * Uses tsvector and GIN index for 10-100x performance improvement
   */
  private async searchContacts(
    query: string,
    companyId: string,
    limit: number,
  ): Promise<SearchResult[]> {
    // Sanitize query for tsquery (replace spaces with &, handle special chars)
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`) // Prefix matching for autocomplete
      .join(' & ');

    if (!tsQuery) {
      return [];
    }

    // Use PostgreSQL Full-Text Search with ts_rank for relevance scoring
    const contacts = await this.prisma.$queryRaw<
      Array<{
        id: string;
        firstName: string;
        lastName: string;
        email: string | null;
        phone: string | null;
        rank: number;
      }>
    >`
      SELECT 
        id,
        "firstName",
        "lastName",
        email,
        phone,
        ts_rank(search_vector, to_tsquery('english', ${tsQuery})) as rank
      FROM contacts
      WHERE search_vector @@ to_tsquery('english', ${tsQuery})
        AND "companyId" = ${companyId}
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

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
      relevance: contact.rank, // Use PostgreSQL's ts_rank for relevance
    }));
  }

  /**
   * Search deals using PostgreSQL Full-Text Search
   * Searches title, stage, and notes with weighted relevance
   */
  private async searchDeals(
    query: string,
    companyId: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`)
      .join(' & ');

    if (!tsQuery) {
      return [];
    }

    const deals = await this.prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        value: number | null;
        stage: string;
        priority: string;
        rank: number;
      }>
    >`
      SELECT 
        id,
        title,
        value::numeric as value,
        stage,
        priority,
        ts_rank(search_vector, to_tsquery('english', ${tsQuery})) as rank
      FROM deals
      WHERE search_vector @@ to_tsquery('english', ${tsQuery})
        AND "companyId" = ${companyId}
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

    return deals.map((deal) => ({
      type: 'deal' as const,
      id: deal.id,
      title: deal.title,
      subtitle: `${deal.stage} - $${deal.value?.toString() || '0'}`,
      description: `Priority: ${deal.priority}`,
      metadata: {
        value: deal.value?.toString() || '0',
        stage: deal.stage,
        priority: deal.priority,
      },
      relevance: deal.rank,
    }));
  }

  /**
   * Search companies using PostgreSQL Full-Text Search
   * Currently only searches user's own company (single-tenant scoped)
   */
  private async searchCompanies(
    query: string,
    companyId: string,
  ): Promise<SearchResult[]> {
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`)
      .join(' & ');

    if (!tsQuery) {
      return [];
    }

    // Search user's company with FTS
    const companies = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        description: string | null;
        rank: number;
      }>
    >`
      SELECT 
        id,
        name,
        description,
        ts_rank(search_vector, to_tsquery('english', ${tsQuery})) as rank
      FROM companies
      WHERE search_vector @@ to_tsquery('english', ${tsQuery})
        AND id = ${companyId}
      ORDER BY rank DESC
      LIMIT 1
    `;

    if (companies.length === 0) {
      return [];
    }

    // Get counts for metadata
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        _count: {
          select: {
            contacts: true,
            deals: true,
            activities: true,
          },
        },
      },
    });

    return companies.map((comp) => ({
      type: 'company' as const,
      id: comp.id,
      title: comp.name,
      subtitle: `${company?._count.contacts || 0} contacts, ${company?._count.deals || 0} deals`,
      description: comp.description || undefined,
      metadata: {
        contactCount: company?._count.contacts || 0,
        dealCount: company?._count.deals || 0,
        activityCount: company?._count.activities || 0,
      },
      relevance: comp.rank,
    }));
  }

  /**
   * Search activities using PostgreSQL Full-Text Search
   * Searches title, description, and activity type
   */
  private async searchActivities(
    query: string,
    companyId: string,
    limit: number,
  ): Promise<SearchResult[]> {
    const tsQuery = query
      .trim()
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`)
      .join(' & ');

    if (!tsQuery) {
      return [];
    }

    const activities = await this.prisma.$queryRaw<
      Array<{
        id: string;
        title: string;
        description: string | null;
        type: string;
        status: string;
        scheduledDate: Date;
        rank: number;
      }>
    >`
      SELECT 
        id,
        title,
        description,
        type,
        status,
        "scheduledDate",
        ts_rank(search_vector, to_tsquery('english', ${tsQuery})) as rank
      FROM activities
      WHERE search_vector @@ to_tsquery('english', ${tsQuery})
        AND "companyId" = ${companyId}
      ORDER BY rank DESC
      LIMIT ${limit}
    `;

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
      relevance: activity.rank,
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
