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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { RequestWithUser } from '../common/types/request.types';
import {
  ApiList,
  ApiGetById,
  ApiCreate,
  ApiUpdate,
  ApiDelete,
} from '../common/swagger/swagger-decorators';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(AuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @Permissions(PERMISSIONS.CONTACT_CREATE)
  @ApiCreate('Create contact', 'Create a new contact in the CRM system')
  create(
    @Body() createContactDto: CreateContactDto,
    @Request() req: RequestWithUser,
  ) {
    return this.contactsService.create(createContactDto, req.user.companyId);
  }

  @Get()
  @Permissions(PERMISSIONS.CONTACT_READ)
  @ApiList(
    'Get all contacts',
    'Retrieve all contacts with pagination and search support',
  )
  findAll(@Query() pagination: PaginationDto, @Request() req: RequestWithUser) {
    return this.contactsService.findAll(req.user.companyId, pagination);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.CONTACT_READ)
  @ApiGetById('Get contact by ID', 'Retrieve detailed contact information')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.contactsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.CONTACT_UPDATE)
  @ApiUpdate('Update contact', 'Update contact information')
  update(
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
    @Request() req: RequestWithUser,
  ) {
    return this.contactsService.update(
      id,
      updateContactDto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.CONTACT_DELETE)
  @ApiDelete('Delete contact', 'Permanently delete a contact from the system')
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.contactsService.remove(id, req.user.companyId);
  }
}
