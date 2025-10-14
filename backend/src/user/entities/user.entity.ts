import { Role } from '@prisma/client';

export class User {
  id: number;
  email: string;
  password: string;
  name?: string;
  role: Role;
  companyId: number;
  createdAt: Date;
  updatedAt: Date;
}