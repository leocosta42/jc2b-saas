import { ProdutoForm } from './produto-form'
import { getFornecedoresList, getNextSku, getProdutoById } from '@/app/actions/produtos'

export default async function NovoProdutoPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const copyId = typeof resolvedParams.copy_id === 'string' ? resolvedParams.copy_id : null

  const fornecedores = await getFornecedoresList()
  const nextSku = await getNextSku()
  
  let produtoCopiar = null
  if (copyId) {
    produtoCopiar = await getProdutoById(copyId)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {copyId ? 'Copiar Produto' : 'Novo Produto'}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {copyId ? 'Cadastre um novo item copiando dados de um existente.' : 'Cadastre um novo item no estoque com código sequencial automático.'}
        </p>
      </div>
      <ProdutoForm 
        fornecedores={fornecedores} 
        nextSku={nextSku} 
        produtoCopiar={produtoCopiar}
      />
    </div>
  )
}
