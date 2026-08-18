import { ProdutoForm } from './produto-form'
import { getFornecedoresList } from '@/app/actions/produtos'

export default async function NovoProdutoPage() {
  const fornecedores = await getFornecedoresList()

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Novo Produto</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Cadastre um novo item no estoque.
        </p>
      </div>
      <ProdutoForm fornecedores={fornecedores} />
    </div>
  )
}
