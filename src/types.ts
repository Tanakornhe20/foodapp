export interface Sale {
  id?: string;
  date: string;
  category: 'Roti' | 'Congee';
  session: 'Morning' | 'Evening';
  amount: number;
  authorUid: string;
  createdAt: string;
}

export interface Expense {
  id?: string;
  date: string;
  segment: 'Roti' | 'Congee' | 'General';
  category: string;
  item: string;
  qty: number;
  unit: string;
  amount: number;
  authorUid: string;
  createdAt: string;
}

export interface Ingredient {
  id?: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  authorUid: string;
  updatedAt: string;
}

export type OperationType = 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
