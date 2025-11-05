import { Controller, Get, Res } from '@nestjs/common';
import { AppService } from './app.service';
import type { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Handle favicon requests to prevent 404 logs
  @Get('favicon.ico')
  getFavicon(@Res() res: Response): void {
    res.status(204).end(); // No Content
  }
}
