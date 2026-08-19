import { z } from 'zod'

// Esquema base de endereço (comum a muitos módulos)
export const addressSchema = z.object({
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
})

// Validação de Cliente
export const clienteSchema = addressSchema.extend({
  nome: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  documento: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal('')),
})

// Validação de Vendedor
export const vendedorSchema = z.object({
  nome: z.string().min(2, "O nome deve ter no mínimo 2 caracteres"),
  telefone: z.string().optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal('')),
  documento: z.string().optional(),
  codigo: z.string().optional(),
  comissao_percentual: z.string().optional(),
})

// Validação de Fornecedor
export const fornecedorSchema = addressSchema.extend({
  codigo: z.string().optional(),
  nome: z.string().min(2, "A razão social/nome deve ter no mínimo 2 caracteres"),
  documento: z.string().optional(), // CNPJ ou CPF
  celular: z.string().optional(),
  email: z.string().email("Formato de email inválido").optional().or(z.literal('')),
})
