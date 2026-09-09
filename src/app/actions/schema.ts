import { z } from 'zod'

// ==================== UTILITÁRIOS ====================

// Validar CPF/CNPJ básico (sem checar dígito verificador)
const cpfCnpjRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
const validateCpfCnpj = (value: string | undefined) => {
  if (!value) return true // opcional
  return cpfCnpjRegex.test(value) || value.replace(/\D/g, '').length >= 11
}

// Validar CEP brasileiro
const cepRegex = /^\d{5}-\d{3}$/
const validateCep = (value: string | undefined) => {
  if (!value) return true // opcional
  return cepRegex.test(value) || value.replace(/\D/g, '').length === 8
}

// Validar telefone brasileiro
const phoneRegex = /^(?:\(?[1-9]{2}\)?)?(?:9\d{4}|\d{4})-?\d{4}$/
const validatePhone = (value: string | undefined) => {
  if (!value) return true // opcional
  return phoneRegex.test(value.replace(/\D/g, ''))
}

// ==================== SCHEMAS BASE ====================

// Esquema de endereço (comum a clientes, fornecedores, etc)
export const addressSchema = z.object({
  cep: z.string()
    .optional()
    .refine(validateCep, "CEP inválido. Use formato XXXXX-XXX"),
  rua: z.string().max(100, "Rua deve ter no máximo 100 caracteres").optional(),
  numero: z.string().max(20, "Número deve ter no máximo 20 caracteres").optional(),
  complemento: z.string().max(100, "Complemento deve ter no máximo 100 caracteres").optional(),
  bairro: z.string().max(50, "Bairro deve ter no máximo 50 caracteres").optional(),
  cidade: z.string().max(50, "Cidade deve ter no máximo 50 caracteres").optional(),
  estado: z.string()
    .length(2, "Estado deve ter 2 caracteres (ex: SP)")
    .optional()
    .or(z.literal('')),
})

// ==================== AUTENTICAÇÃO ====================

export const loginSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .min(5, "Email deve ter no mínimo 5 caracteres")
    .max(100, "Email deve ter no máximo 100 caracteres"),
  password: z.string()
    .min(6, "Senha deve ter no mínimo 6 caracteres")
    .max(100, "Senha deve ter no máximo 100 caracteres"),
})

export const registerSchema = loginSchema.extend({
  name: z.string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
})

// ==================== CLIENTES ====================

export const clienteSchema = addressSchema.extend({
  codigo: z.string()
    .max(20, "Código deve ter no máximo 20 caracteres")
    .optional(),
  nome: z.string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  documento: z.string()
    .optional()
    .refine(validateCpfCnpj, "CPF/CNPJ inválido"),
  inscricao: z.string()
    .max(20, "Inscrição Estadual deve ter no máximo 20 caracteres")
    .optional(),
  celular: z.string()
    .optional()
    .refine(validatePhone, "Telefone inválido"),
  email: z.string()
    .email("Email inválido")
    .optional()
    .or(z.literal('')),
  bloqueado: z.boolean().optional(),
})

// ==================== VENDEDORES ====================

export const vendedorSchema = z.object({
  codigo: z.string()
    .max(20, "Código deve ter no máximo 20 caracteres")
    .optional(),
  nome: z.string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  documento: z.string()
    .optional()
    .refine(validateCpfCnpj, "CPF/CNPJ inválido"),
  telefone: z.string()
    .optional()
    .refine(validatePhone, "Telefone inválido"),
  email: z.string()
    .email("Email inválido")
    .optional()
    .or(z.literal('')),
  comissao_percentual: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : 0)
    .refine(v => v >= 0 && v <= 100, "Comissão deve estar entre 0% e 100%"),
})

// ==================== FORNECEDORES ====================

export const fornecedorSchema = addressSchema.extend({
  codigo: z.string()
    .max(20, "Código deve ter no máximo 20 caracteres")
    .optional(),
  nome: z.string()
    .min(2, "Razão Social/Nome deve ter no mínimo 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  documento: z.string()
    .optional()
    .refine(validateCpfCnpj, "CNPJ/CPF inválido"),
  celular: z.string()
    .optional()
    .refine(validatePhone, "Telefone inválido"),
  email: z.string()
    .email("Email inválido")
    .optional()
    .or(z.literal('')),
  bloqueado: z.boolean().optional(),
})

// ==================== PRODUTOS ====================

export const produtoSchema = z.object({
  codigo: z.string()
    .max(20, "Código deve ter no máximo 20 caracteres")
    .optional(),
  descricao: z.string()
    .min(2, "Descrição deve ter no mínimo 2 caracteres")
    .max(200, "Descrição deve ter no máximo 200 caracteres"),
  um: z.string()
    .max(10, "Unidade de Medida deve ter no máximo 10 caracteres")
    .optional(),
  ncm: z.string()
    .regex(/^\d{8}$/, "NCM deve ter 8 dígitos")
    .optional()
    .or(z.literal('')),
  peso: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : 0)
    .refine(v => v >= 0, "Peso não pode ser negativo"),
  preco_custo: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : 0)
    .refine(v => v >= 0, "Preço de custo não pode ser negativo"),
  preco_venda: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : 0)
    .refine(v => v > 0, "Preço de venda deve ser maior que zero"),
  quantidade_estoque: z.string()
    .optional()
    .transform(v => v ? parseInt(v) : 0)
    .refine(v => v >= 0 && Number.isInteger(v), "Quantidade deve ser um número inteiro não-negativo"),
  fornecedor_id: z.string().optional(),
  bloqueado: z.boolean().optional(),
})

// ==================== ESTOQUE ====================

export const ajusteEstoqueSchema = z.object({
  produto_id: z.string().uuid("ID do produto inválido"),
  quantidade_nova: z.string()
    .transform(v => parseInt(v))
    .refine(v => Number.isInteger(v) && v >= 0, "Quantidade deve ser um número inteiro não-negativo"),
  motivo: z.enum(['entrada_manual', 'devolucao', 'perda', 'contagem']),
  observacoes: z.string()
    .max(500, "Observações deve ter no máximo 500 caracteres")
    .optional(),
})

// ==================== PEDIDOS/ORÇAMENTOS ====================

export const itemPedidoSchema = z.object({
  produto_id: z.string().uuid("ID do produto inválido"),
  quantidade: z.string()
    .transform(v => parseInt(v))
    .refine(v => Number.isInteger(v) && v > 0, "Quantidade deve ser um número inteiro maior que zero"),
  preco_unitario: z.string()
    .transform(v => parseFloat(v))
    .refine(v => v > 0, "Preço unitário deve ser maior que zero"),
  desconto_percentual: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : 0)
    .refine(v => v >= 0 && v <= 100, "Desconto deve estar entre 0% e 100%"),
  unidade_medida: z.string()
    .max(10, "Unidade de medida deve ter no máximo 10 caracteres")
    .optional(),
})

export const documentoSchema = z.object({
  tipo: z.enum(['ORCAMENTO', 'PEDIDO']),
  cliente_id: z.string().uuid("ID do cliente inválido"),
  vendedor_id: z.string().uuid("ID do vendedor inválido").optional(),
  data_emissao: z.string()
    .refine(v => !isNaN(Date.parse(v)), "Data de emissão inválida"),
  data_entrega: z.string()
    .optional()
    .refine(v => !v || !isNaN(Date.parse(v)), "Data de entrega inválida"),
  forma_pagamento: z.string()
    .max(50, "Forma de pagamento deve ter no máximo 50 caracteres")
    .optional(),
  observacoes: z.string()
    .max(500, "Observações deve ter no máximo 500 caracteres")
    .optional(),
  valor_frete: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : 0)
    .refine(v => v >= 0, "Frete não pode ser negativo"),
  tipo_frete: z.string()
    .max(10, "Tipo de frete deve ter no máximo 10 caracteres")
    .optional(),
  desconto_total: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : 0)
    .refine(v => v >= 0, "Desconto não pode ser negativo"),
  peso_total: z.string()
    .optional()
    .transform(v => v ? parseFloat(v) : null)
    .refine(v => v === null || v >= 0, "Peso não pode ser negativo"),
  itens: z.array(itemPedidoSchema)
    .min(1, "Documento deve ter pelo menos um item"),
})
