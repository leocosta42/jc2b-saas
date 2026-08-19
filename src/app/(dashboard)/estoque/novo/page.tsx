import { ProdutoForm } from './produto-form'
import { getFornecedoresList, getNextSku, getProdutoById } from '@/app/actions/produtos'

export default async function NovoProdutoPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const copyId = typeof resolvedParams.copy_id === 'string' ? resolvedParams.copy_id : null
  const editId = typeof resolvedParams.edit_id === 'string' ? resolvedParams.edit_id : null

  const fornecedores = await getFornecedoresList()
  const nextSku = await getNextSku()
  
  let produtoData = null
  if (copyId) {
    produtoData = await getProdutoById(copyId)
  } else if (editId) {
    produtoData = await getProdutoById(editId)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {editId ? 'Editar Produto' : (copyId ? 'Copiar Produto' : 'Novo Produto')}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          {editId ? 'Atualize os dados deste produto.' : (copyId ? 'Cadastre um novo item copiando dados de um existente.' : 'Cadastre um novo item no estoque com código sequencial automático.')}
        </p>
      </div>
      <ProdutoForm 
        fornecedores={fornecedores} 
        nextSku={nextSku} 
        produtoCopiar={produtoData}
        isEdit={!!editId}
        editId={editId}
      />
    </div>
  )
}
