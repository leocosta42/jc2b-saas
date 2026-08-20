"use server"

// Simulador da API do Melhor Envio
// Em produção, isso faria um fetch para https://www.melhorenvio.com.br/api/v2/me/shipment/calculate
// utilizando o Bearer Token do usuário.

export async function simularMelhorEnvio(cepOrigem: string, cepDestino: string, pesoKg: number, valorSeguro: number) {
  // Simulando delay da API
  await new Promise(resolve => setTimeout(resolve, 1500))

  if (!cepDestino || cepDestino.length < 8) {
    return { error: "CEP de destino inválido." }
  }

  // Base de cálculo simulada (apenas para o WOW factor antes de plugar a chave real)
  const pesoFaturado = Math.max(pesoKg, 1) // minimo 1kg
  
  const options = [
    {
      id: 1,
      name: "PAC (Correios)",
      company: "Correios",
      price: 18.50 + (pesoFaturado * 2.30),
      delivery_time: 7,
      logo: "https://logodownload.org/wp-content/uploads/2014/05/correios-logo-1-1.png"
    },
    {
      id: 2,
      name: "SEDEX (Correios)",
      company: "Correios",
      price: 32.90 + (pesoFaturado * 4.50),
      delivery_time: 2,
      logo: "https://logodownload.org/wp-content/uploads/2014/05/correios-logo-1-1.png"
    },
    {
      id: 3,
      name: ".Package",
      company: "Jadlog",
      price: 16.20 + (pesoFaturado * 2.10),
      delivery_time: 6,
      logo: "https://logodownload.org/wp-content/uploads/2021/03/jadlog-logo-0.png"
    },
    {
      id: 4,
      name: ".Com",
      company: "Jadlog",
      price: 28.40 + (pesoFaturado * 3.80),
      delivery_time: 3,
      logo: "https://logodownload.org/wp-content/uploads/2021/03/jadlog-logo-0.png"
    }
  ]

  // Ordena pelo mais barato
  return { data: options.sort((a, b) => a.price - b.price) }
}
