export class Company {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  users?: any[]; // User[]
  contacts?: any[]; // Contact[]
  deals?: any[]; // Deal[]
}
