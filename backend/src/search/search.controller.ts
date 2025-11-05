import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SearchService, SearchResult } from './search.service';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
    companyId: string;
  };
}

@Controller('search')
@UseGuards(AuthGuard('jwt'))
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Global search endpoint
   * GET /api/search?q=john&types[]=contacts&types[]=deals&limit=20
   */
  @Get()
  async globalSearch(
    @Query('q') query: string,
    @Query('types') types: string | string[],
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ): Promise<SearchResult[]> {
    // Parse types parameter
    let searchTypes:
      | Array<'contact' | 'deal' | 'company' | 'activity'>
      | undefined = undefined;

    if (types) {
      const typeArray = Array.isArray(types) ? types : [types];
      searchTypes = typeArray.filter((t) =>
        ['contact', 'deal', 'company', 'activity'].includes(t),
      ) as Array<'contact' | 'deal' | 'company' | 'activity'>;
    }

    // Parse limit parameter
    const resultLimit = limit ? parseInt(limit, 10) : 10;

    return this.searchService.globalSearch(
      query,
      req.user.companyId,
      searchTypes,
      resultLimit,
    );
  }

  /**
   * Search suggestions for autocomplete
   * GET /api/search/suggestions?q=jo
   */
  @Get('suggestions')
  async getSearchSuggestions(
    @Query('q') query: string,
    @Request() req: RequestWithUser,
  ): Promise<SearchResult[]> {
    return this.searchService.getSearchSuggestions(query, req.user.companyId);
  }

  /**
   * Search by specific type
   * GET /api/search/contacts?q=john&limit=20
   */
  @Get('contacts')
  async searchContacts(
    @Query('q') query: string,
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ): Promise<SearchResult[]> {
    const resultLimit = limit ? parseInt(limit, 10) : 20;
    return this.searchService.searchByType(
      'contact',
      query,
      req.user.companyId,
      resultLimit,
    );
  }

  @Get('deals')
  async searchDeals(
    @Query('q') query: string,
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ): Promise<SearchResult[]> {
    const resultLimit = limit ? parseInt(limit, 10) : 20;
    return this.searchService.searchByType(
      'deal',
      query,
      req.user.companyId,
      resultLimit,
    );
  }

  @Get('companies')
  async searchCompanies(
    @Query('q') query: string,
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ): Promise<SearchResult[]> {
    const resultLimit = limit ? parseInt(limit, 10) : 20;
    return this.searchService.searchByType(
      'company',
      query,
      req.user.companyId,
      resultLimit,
    );
  }

  @Get('activities')
  async searchActivities(
    @Query('q') query: string,
    @Query('limit') limit: string,
    @Request() req: RequestWithUser,
  ): Promise<SearchResult[]> {
    const resultLimit = limit ? parseInt(limit, 10) : 20;
    return this.searchService.searchByType(
      'activity',
      query,
      req.user.companyId,
      resultLimit,
    );
  }
}
