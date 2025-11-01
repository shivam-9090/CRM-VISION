import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('contacts')
@UseGuards(AuthGuard, PermissionsGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Permissions(PERMISSIONS.CONTACT_CREATE)
  create(@Body() createContactDto: CreateContactDto, @Request() req: RequestWithUser) {
    return this.contactsService.create(createContactDto, req.user.companyId);
  }

  @Get()
  @Permissions(PERMISSIONS.CONTACT_READ)
  findAll(@Query() pagination: PaginationDto, @Request() req: RequestWithUser) {
    return this.contactsService.findAll(req.user.companyId, pagination);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CONTACT_READ)
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.contactsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.CONTACT_UPDATE)
  update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto, @Request() req: RequestWithUser) {
    return this.contactsService.update(id, updateContactDto, req.user.companyId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.CONTACT_DELETE)
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.contactsService.remove(id, req.user.companyId);
  }
}