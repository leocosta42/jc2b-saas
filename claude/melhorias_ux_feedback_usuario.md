# IDEIAS DE MELHORIAS - Feedback do Usuário Real

**Fonte:** Feedback prático de quem está usando o sistema  
**Prioridade:** ALTA (melhoram muito a usabilidade)  
**Tempo Estimado:** 1-2 semanas

---

## 🔴 BUGS/PROBLEMAS ENCONTRADOS

### Problema #1: Duplicação de Produtos Permitida

**Situação:** Você cadastrou 2 produtos com mesmo nome (copiar/colar)  
**Impacto:** Confusão em estoque, faturamento, relatórios

**Solução:**

```typescript
// actions/produtos.ts - Adicionar validação de duplicata
export async function createProduto(data: any) {
  // ... código existente
  
  // NOVO: Validar se já existe produto com mesmo nome
  if (data.nome) {
    const { data: existente } = await supabase
      .from('produtos')
      .select('id, nome')
      .eq('tenant_id', tenantId)
      .eq('nome', data.nome.trim())
      .maybeSingle()  // ← Não .single()!

    if (existente) {
      return { 
        error: `Já existe um produto chamado "${data.nome}". Use outro nome ou edite o existente.` 
      }
    }
  }

  // ... continuar
}

// Também adicionar no frontend para feedback imediato:
// src/app/components/ProdutoForm.tsx
const [erroNome, setErroNome] = useState("")

const handleVerificarNome = async (nome: string) => {
  if (!nome) return
  
  const produtosExistentes = await searchProdutosAPI(nome.trim())
  const encontrou = produtosExistentes.find(
    p => p.nome.toLowerCase() === nome.toLowerCase() && p.id !== produtoEdit?.id
  )
  
  if (encontrou) {
    setErroNome(`❌ Produto "${encontrou.nome}" já existe!`)
  } else {
    setErroNome("")
  }
}

// Usar no input:
<input
  value={nome}
  onChange={(e) => {
    setNome(e.target.value)
    handleVerificarNome(e.target.value)
  }}
  className={erroNome ? "border-red-500" : ""}
/>
{erroNome && <p className="text-red-500 text-sm">{erroNome}</p>}
```

**Tempo:** 1-2 horas

---

### Problema #2: Unidade de Peso Muito Grande Para Parafusos

**Situação:** Parafuso pesa 0.001 kg, não aceita  
**Problema:** Sistema prevê valores em kg, muito grande para itens pequenos

**Solução: Sistema de Unidades com Conversão**

```typescript
// Criar tipos de unidades
const UNIDADES_PESO = {
  'mg': { nome: 'Miligramas', valor_kg: 0.000001 },
  'g': { nome: 'Gramas', valor_kg: 0.001 },
  'kg': { nome: 'Quilogramas', valor_kg: 1 }
}

// products.ts table precisa de 2 novos campos:
ALTER TABLE produtos ADD COLUMN peso_quantidade DECIMAL DEFAULT 1;
ALTER TABLE produtos ADD COLUMN peso_unidade VARCHAR DEFAULT 'g';

// Assim:
// - Parafuso: peso = 0.5, unidade = 'g' (= 0.0005 kg)
// - Placa: peso = 2.5, unidade = 'kg' (= 2.5 kg)

// Converter para kg no banco quando salva:
function converterParaKg(peso: number, unidade: string): number {
  return peso * UNIDADES_PESO[unidade].valor_kg
}

// Componente:
<div className="flex gap-2">
  <input 
    type="number"
    value={pesoQuantidade}
    onChange={(e) => setPesoQuantidade(Number(e.target.value))}
    placeholder="0.5"
    step="0.001"
  />
  <select value={pesoUnidade} onChange={(e) => setPesoUnidade(e.target.value)}>
    <option value="mg">mg (Miligramas)</option>
    <option value="g">g (Gramas)</option>
    <option value="kg">kg (Quilogramas)</option>
  </select>
</div>

{/* Mostra conversão */}
<p className="text-sm text-gray-600">
  = {converterParaKg(pesoQuantidade, pesoUnidade).toFixed(6)} kg
</p>
```

**Tempo:** 3-4 horas  
**Benefício:** Perfeito para parafusos, componentes eletrônicos, etc.

---

### Problema #3: Saldo de Estoque Zerado Após Cadastro

**Situação:** Cadastrou produto com saldo 100, mas aparece 0  
**Causa Provável:** Bug no campo `quantidade_estoque` não estar sendo salvo

**Verificação:**

```typescript
// Verificar se campo está sendo enviado:
console.log("Dados sendo salvos:", data)

// Se falta quantidade_estoque:
const { error } = await supabase
  .from('produtos')
  .insert({
    tenant_id: tenantId,
    nome: data.nome,
    sku: data.sku,
    preco_venda: data.preco_venda,
    quantidade_estoque: data.quantidade_estoque || 0,  // ← Adicionar DEFAULT
    // ... outros campos
  })
```

**Solução Alternativa: Tela de Entrada Manual de Saldo**

Permitir ajustar saldo depois (ver "Problema #7" abaixo)

**Tempo:** 30 minutos para debugar + 2 horas para tela de ajuste manual

---

## 💡 MELHORIAS DE UX/UI

### Melhoria #1: Modal Flutuante para Editar Item

**Problema Atual:** Edita quantidade/desconto inline, fica confuso  
**Solução:** Quando clica em produto no orçamento, abre modal limpo

**Implementação:**

```typescript
// Criar componente: EditarItemModal.tsx
interface EditarItemModalProps {
  isOpen: boolean
  item: ItemPedido
  onClose: () => void
  onSalvar: (item: ItemPedido) => void
}

export function EditarItemModal({ isOpen, item, onClose, onSalvar }: EditarItemModalProps) {
  const [quantidade, setQuantidade] = useState(item.quantidade)
  const [desconto, setDesconto] = useState(item.desconto_percentual)
  
  const valorOriginal = item.preco_unitario * quantidade
  const valorComDesconto = valorOriginal * (1 - desconto / 100)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Produto */}
          <div>
            <p className="text-sm font-semibold text-gray-600">Produto</p>
            <p className="text-lg">{item.produto_nome}</p>
            <p className="text-xs text-gray-500">SKU: {item.produto_sku}</p>
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-sm font-medium mb-1">Quantidade</label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              min="1"
            />
          </div>

          {/* Preço */}
          <div>
            <p className="text-sm font-medium text-gray-600">Preço Unitário</p>
            <p className="text-lg font-semibold">R$ {item.preco_unitario.toFixed(2)}</p>
          </div>

          {/* Desconto */}
          <div>
            <label className="block text-sm font-medium mb-1">Desconto (%)</label>
            <input
              type="number"
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
              min="0"
              max="100"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span>R$ {valorOriginal.toFixed(2)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Desconto ({desconto}%):</span>
                <span>-R$ {(valorOriginal * desconto / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total:</span>
              <span>R$ {valorComDesconto.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSalvar({ ...item, quantidade, desconto_percentual: desconto })}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Usar em FormularioVenda:
const [itemEditando, setItemEditando] = useState<ItemPedido | null>(null)

const handleEditarItem = (item: ItemPedido) => {
  setItemEditando(item)
}

<EditarItemModal
  isOpen={!!itemEditando}
  item={itemEditando!}
  onClose={() => setItemEditando(null)}
  onSalvar={(itemAtualizado) => {
    // Atualizar lista de itens
    setItens(itens.map(i => i.id === itemAtualizado.id ? itemAtualizado : i))
    setItemEditando(null)
  }}
/>
```

**Tempo:** 3-4 horas  
**Benefício:** Muito mais limpo e intuitivo

---

### Melhoria #2: Remover Duplicação de Menu Esquerda/Direita

**Problema Atual:** Sidebar + Menu mobile = duplo espaço  
**Solução:** Menu único + Breadcrumb

```typescript
// Simplificar layout.tsx
// REMOVER: Sidebar duplicada

// NOVO: Menu superior com breadcrumb
<header className="bg-white border-b p-4">
  <nav className="flex items-center justify-between">
    {/* Logo/Home */}
    <Link href="/dashboard" className="flex items-center gap-2">
      <Home className="h-5 w-5" />
      <span>JC2B</span>
    </Link>

    {/* Breadcrumb */}
    <div className="text-sm text-gray-600 flex gap-2">
      Dashboard / {currentPage}
    </div>

    {/* Menu mobile hamburger */}
    <MobileMenu />
  </nav>
</header>

// Ganhar espaço = 30% mais conteúdo na tela!
```

**Tempo:** 2-3 horas  
**Benefício:** +30% de espaço útil

---

### Melhoria #3: Responsiveness - Aparecer Inteira na Página

**Problema:** Precisa dar zoom para ver formulário inteiro  
**Solução:** Fazer formulário responsivo + rolagem

```typescript
// FormularioVenda.tsx
// Adicionar max-width e padding responsivo

<div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
  {/* Seções menores e empilháveis */}
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Lado esquerdo */}
    <section>{/* cliente, vendedor */}</section>
    
    {/* Lado direito */}
    <section>{/* datas, pagamento */}</section>
  </div>

  {/* Itens em tela cheia */}
  <section className="w-full overflow-x-auto">
    {/* Tabela de itens */}
  </section>

  {/* Resumo em scroll */}
  <section className="sticky bottom-0 bg-white border-t">
    {/* Totais */}
  </section>
</div>

// CSS para mobile
@media (max-width: 768px) {
  grid-cols-1 // Empilha verticalmente
  font-size reduzido // Fontes menores
  padding reduzido // Menos padding
}
```

**Tempo:** 2-3 horas  
**Benefício:** Funciona perfeitamente em mobile/tablet

---

## 📊 ENTRADAS DE DADOS

### Melhoria #4: Entrada Manual de Saldo de Estoque

**Problema:** Depois de criar produto, não consegue adicionar saldo  
**Solução:** Página de "Ajustes de Estoque"

```typescript
// Criar nova página: src/app/(dashboard)/estoque/ajustes/page.tsx

interface AjusteEstoque {
  produto_id: string
  quantidade_anterior: number
  quantidade_nova: number
  motivo: 'entrada_manual' | 'devolucao' | 'perda' | 'contagem'
  observacoes: string
}

export default function AjustesEstoque() {
  const [produtos, setProdutos] = useState([])
  const [selecionado, setSelecionado] = useState<any>(null)
  const [novoSaldo, setNovoSaldo] = useState("")
  const [motivo, setMotivo] = useState("entrada_manual")
  const [observacoes, setObservacoes] = useState("")

  const handleSalvarAjuste = async () => {
    await supabase.from('ajustes_estoque').insert({
      tenant_id: tenantId,
      produto_id: selecionado.id,
      quantidade_anterior: selecionado.quantidade_estoque,
      quantidade_nova: Number(novoSaldo),
      motivo,
      observacoes,
      data: new Date().toISOString(),
      usuario_id: userId
    })

    // Atualizar quantidade_estoque do produto
    await supabase
      .from('produtos')
      .update({ quantidade_estoque: Number(novoSaldo) })
      .eq('id', selecionado.id)

    toast.success("Saldo atualizado!")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajustes de Estoque</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Esquerda: Selecionar produto */}
        <div>
          <label>Selecionar Produto</label>
          <SearchProduto onSelect={setSelecionado} />
        </div>

        {/* Direita: Dados do ajuste */}
        {selecionado && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Saldo Atual</p>
              <p className="text-2xl font-bold">{selecionado.quantidade_estoque}</p>
            </div>

            <div>
              <label>Novo Saldo</label>
              <input
                type="number"
                value={novoSaldo}
                onChange={(e) => setNovoSaldo(e.target.value)}
                placeholder={selecionado.quantidade_estoque}
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div>
              <label>Motivo</label>
              <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
                <option value="entrada_manual">Entrada Manual</option>
                <option value="devolucao">Devolução</option>
                <option value="perda">Perda/Dano</option>
                <option value="contagem">Contagem Física</option>
              </select>
            </div>

            <div>
              <label>Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Motivo do ajuste..."
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <button
              onClick={handleSalvarAjuste}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Confirmar Ajuste
            </button>
          </div>
        )}
      </div>

      {/* Histórico de ajustes */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Histórico de Ajustes</h2>
        <AjustesTable />
      </div>
    </div>
  )
}
```

**Tempo:** 4-5 horas  
**Benefício:** Controle total de estoque

---

### Melhoria #5: Editor de Peso em Lote

**Problema:** Não tem peso de tudo, quer editar depois  
**Solução:** Página para editar pesos em massa

```typescript
// Criar: src/app/(dashboard)/estoque/pesos/page.tsx

export default function EditarPesos() {
  const [produtos, setProdutos] = useState([])
  const [filtro, setFiltro] = useState("")
  
  const produtosFiltrados = produtos.filter(p => 
    !p.peso_quantidade || p.peso_quantidade === 0  // Mostrar só os sem peso
  )

  const handleSalvarPeso = async (produtoId: string, peso: number, unidade: string) => {
    await supabase
      .from('produtos')
      .update({ 
        peso_quantidade: peso,
        peso_unidade: unidade 
      })
      .eq('id', produtoId)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editor de Pesos</h1>
      
      <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
        <p className="text-sm">
          ⚠️ Mostrando {produtosFiltrados.length} produtos sem peso
        </p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2 text-left">SKU</th>
            <th className="border p-2 text-left">Produto</th>
            <th className="border p-2">Peso</th>
            <th className="border p-2">Unidade</th>
            <th className="border p-2">Ação</th>
          </tr>
        </thead>
        <tbody>
          {produtosFiltrados.map(p => (
            <PesoRow key={p.id} produto={p} onSalvar={handleSalvarPeso} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Componente para cada linha
function PesoRow({ produto, onSalvar }: any) {
  const [peso, setPeso] = useState(produto.peso_quantidade || "")
  const [unidade, setUnidade] = useState(produto.peso_unidade || "g")

  return (
    <tr className="border-b">
      <td className="border p-2">{produto.sku}</td>
      <td className="border p-2">{produto.nome}</td>
      <td className="border p-2">
        <input
          type="number"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          step="0.001"
          className="w-20 border rounded px-2 py-1"
        />
      </td>
      <td className="border p-2">
        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option>mg</option>
          <option>g</option>
          <option>kg</option>
        </select>
      </td>
      <td className="border p-2">
        <button
          onClick={() => onSalvar(produto.id, Number(peso), unidade)}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          Salvar
        </button>
      </td>
    </tr>
  )
}
```

**Tempo:** 3-4 horas  
**Benefício:** Edita pesos de 100 produtos em 10 minutos

---

## 🚫 VALIDAÇÕES

### Melhoria #6: Não Aceitar Valores Negativos

**Implementação:**

```typescript
// Adicionar em TODOS os inputs de quantidade/preço:

<input
  type="number"
  value={valor}
  onChange={(e) => {
    const novoValor = Number(e.target.value)
    if (novoValor < 0) {
      toast.error("❌ Valores não podem ser negativos!")
      return
    }
    setValor(novoValor)
  }}
  min="0"  // ← Adicionar always
  step="0.01"
/>

// Também no backend (validação dupla):
if (data.quantidade < 0 || data.preco < 0) {
  return { error: "Quantidade e preço não podem ser negativos" }
}
```

**Tempo:** 1-2 horas (aplicar em vários campos)

---

## 📋 ORÇAMENTO/PEDIDO

### Melhoria #7: Mostrar Produto Completo

**Problema:** Orçamento não mostra foto/descrição do produto  
**Solução:** Adicionar coluna com detalhes

```typescript
// Na tabela de itens do orçamento:
<table>
  <thead>
    <tr>
      <th>Produto</th>  {/* Nome + SKU */}
      <th>Descrição</th> {/* Campo novo */}
      <th>Qtd</th>
      <th>Preço</th>
      <th>Desconto</th>
      <th>Total</th>
    </tr>
  </thead>
  <tbody>
    {itens.map(item => (
      <tr key={item.id}>
        <td className="font-semibold">{item.produto_nome}</td>
        <td className="text-sm text-gray-600">{item.produto_descricao}</td>
        <td>{item.quantidade}</td>
        {/* ... */}
      </tr>
    ))}
  </tbody>
</table>

// Adicionar campo 'descricao' na tabela produtos:
ALTER TABLE produtos ADD COLUMN descricao TEXT;
```

**Tempo:** 2 horas

---

### Melhoria #8: Layout de Orçamento em Página Única

**Problema:** Formulário grande, difícil acompanhar  
**Solução:** Design tipo "impressão"

```typescript
// Criar novo layout: FormularioVendaPagina.tsx
// Em vez de sidebar com resumo:
// Formulário completo + Resumo embaixo (como impressão)

export default function PaginaOrcamento() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <section className="border-b pb-6 mb-6">
        <Logo />
        <h1>Novo Orçamento</h1>
      </section>

      {/* Cliente e Datas */}
      <section className="grid grid-cols-3 gap-4 mb-6">
        <SelectCliente />
        <InputData label="Emissão" />
        <InputData label="Entrega" />
      </section>

      {/* Itens */}
      <section className="mb-6">
        <h2 className="text-lg font-bold mb-4">Itens do Orçamento</h2>
        <TabelaItens />
      </section>

      {/* Resumo (tipo nota fiscal) */}
      <section className="bg-gray-50 p-6 rounded border-2">
        <div className="grid grid-cols-3 gap-4 text-right mb-4">
          <div>
            <p className="text-sm text-gray-600">Subtotal</p>
            <p className="text-lg font-bold">R$ 1.500,00</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Desconto</p>
            <p className="text-lg font-bold">R$ 150,00</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Frete</p>
            <p className="text-lg font-bold">R$ 50,00</p>
          </div>
        </div>
        <div className="border-t-2 pt-4">
          <div className="flex justify-between text-2xl font-bold">
            <span>TOTAL</span>
            <span>R$ 1.400,00</span>
          </div>
        </div>
      </section>

      {/* Observações e Ações */}
      <section className="mt-6 space-y-4">
        <textarea placeholder="Observações..." />
        
        <div className="flex gap-4">
          <button>← Voltar</button>
          <button>Salvar Rascunho</button>
          <button>Gerar PDF</button>
          <button>Confirmar Orçamento</button>
        </div>
      </section>
    </div>
  )
}
```

**Tempo:** 5-6 horas  
**Benefício:** Layout profissional, fácil de usar

---

## 📊 RESUMO DE MELHORIAS

| Melhoria | Tipo | Tempo | Prioridade |
|----------|------|-------|-----------|
| 1. Validar Duplicata de Produtos | Bug | 1-2h | 🔴 CRÍTICO |
| 2. Unidades de Peso (mg/g/kg) | Feature | 3-4h | 🔴 CRÍTICO |
| 3. Debug Saldo Estoque | Bug | 1-2h | 🔴 CRÍTICO |
| 4. Modal Editar Item | UX | 3-4h | 🟡 ALTO |
| 5. Remover Menu Duplicado | UI | 2-3h | 🟡 ALTO |
| 6. Responsiveness | UI | 2-3h | 🟡 ALTO |
| 7. Entrada Manual Estoque | Feature | 4-5h | 🟡 ALTO |
| 8. Editor de Pesos | Feature | 3-4h | 🟠 MÉDIO |
| 9. Validação Valores Negativos | Feature | 1-2h | 🟠 MÉDIO |
| 10. Mostrar Produto Completo | Feature | 2h | 🟠 MÉDIO |
| 11. Layout Página Única | UI | 5-6h | 🟠 MÉDIO |

---

## 🎯 ROADMAP RECOMENDADO

### Semana 1 (CRÍTICO):
- [ ] #1 Validar Duplicata
- [ ] #2 Sistema de Unidades
- [ ] #3 Debug Saldo Estoque
- [ ] #9 Validação Negativos

**Total: 6-10 horas**

### Semana 2 (IMPORTANTE):
- [ ] #4 Modal Editar Item
- [ ] #5 Remover Duplicação Menu
- [ ] #6 Responsiveness
- [ ] #7 Entrada Manual Estoque

**Total: 11-15 horas**

### Semana 3 (MELHORIAS):
- [ ] #8 Editor de Pesos
- [ ] #10 Produto Completo
- [ ] #11 Layout Página Única

**Total: 10-12 horas**

---

## 💡 CONCLUSÃO

Suas sugestões são **EXCELENTES** e muito práticas:

✅ Identifica real pain points do usuário  
✅ Propõe soluções claras  
✅ Melhoram muito a experiência  

**Prioridade Total:** 27-37 horas de desenvolvimento  

Com isso implementado, o sistema fica **profissional e fácil de usar!**

---

**Análise de Melhorias:** Agosto 2026  
**Baseado em:** Feedback real de usuário  
**Status:** Pronto para implementar!
