import { z } from 'zod';
import { isValidDocumentDigits } from './br-input-masks';

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  document: z.string().refine(isValidDocumentDigits, 'CPF/CNPJ inválido'),
  phone: z.string().max(20).optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  personType: z.enum(['INDIVIDUAL', 'COMPANY']),
  customerType: z.enum(['BUYER', 'SELLER', 'BOTH']).optional(),
  street: z.string().max(200).optional(),
  number: z.string().max(20).optional(),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().max(10).optional(),
  notes: z.string().max(5000).optional(),
  assignedSellerId: z.union([z.string().uuid(), z.literal('')]).optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function emptyCustomerForm(): CustomerFormValues {
  return {
    name: '',
    document: '',
    phone: '',
    email: '',
    personType: 'INDIVIDUAL',
    customerType: 'BUYER',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    notes: '',
    assignedSellerId: '',
  };
}

export function toCustomerPayload(values: CustomerFormValues) {
  return {
    name: values.name.trim(),
    document: values.document.replace(/\D/g, ''),
    phone: values.phone?.replace(/\D/g, '') || undefined,
    email: values.email?.trim() || undefined,
    personType: values.personType,
    customerType: values.customerType,
    street: values.street?.trim() || undefined,
    number: values.number?.trim() || undefined,
    complement: values.complement?.trim() || undefined,
    neighborhood: values.neighborhood?.trim() || undefined,
    city: values.city?.trim() || undefined,
    state: values.state?.trim().toUpperCase() || undefined,
    zipCode: values.zipCode?.replace(/\D/g, '') || undefined,
    notes: values.notes?.trim() || undefined,
    assignedSellerId: values.assignedSellerId || undefined,
  };
}
