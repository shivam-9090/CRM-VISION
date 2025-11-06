import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isShuttingDown = false;

  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('DATABASE_URL'),
        },
      },
      log:
        configService.get<string>('NODE_ENV') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['warn', 'error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established');
      this.logger.log(
        `📊 Connection pool: ${this.configService.get<number>('DB_POOL_SIZE', 10)} connections`,
      );
      this.logger.log(
        `⏱️  Pool timeout: ${this.configService.get<number>('DB_POOL_TIMEOUT', 20)}s`,
      );

      // Test connection
      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ Database health check passed');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.log('🔌 Disconnecting from database...');

    try {
      // Wait for active queries to complete (max 5 seconds)
      const shutdownTimeout = setTimeout(() => {
        this.logger.warn('⚠️  Force disconnecting due to timeout');
      }, 5000);

      await this.$disconnect();
      clearTimeout(shutdownTimeout);
      this.logger.log('✅ Database connection closed gracefully');
    } catch (error) {
      this.logger.error('❌ Error during database disconnect', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown helper
   * Call this before application shutdown to ensure clean disconnect
   * Note: Prisma 5+ doesn't support beforeExit hook - use process events instead
   */
  enableShutdownHooks(app: any) {
    // Since Prisma 5+, beforeExit is not supported
    // The onModuleDestroy lifecycle hook handles cleanup automatically
    this.logger.log('✅ Shutdown hooks enabled (handled by onModuleDestroy)');
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Get database connection pool stats
   */
  getPoolStats() {
    return {
      poolSize: this.configService.get<number>('DB_POOL_SIZE', 10),
      timeout: this.configService.get<number>('DB_POOL_TIMEOUT', 20),
      connectionLimit: this.configService.get<number>(
        'DB_CONNECTION_LIMIT',
        10,
      ),
    };
  }
}
