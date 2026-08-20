"use server"

// Simulador da API do Melhor Envio
// Em produção, isso faria um fetch para https://www.melhorenvio.com.br/api/v2/me/shipment/calculate
// utilizando o Bearer Token do usuário.

export async function simularMelhorEnvio(cepOrigem: string, cepDestino: string, pesoKg: number, valorSeguro: number) {
  const token = process.env.MELHOR_ENVIO_TOKEN

  if (!cepDestino || cepDestino.replace(/\D/g, '').length !== 8) {
    return { error: "CEP de destino inválido." }
  }

  // Se não tiver Token no .env, usamos a simulação para não quebrar a tela
  if (!token) {
    await new Promise(resolve => setTimeout(resolve, 1500))
    const pesoFaturado = Math.max(pesoKg, 1)
    return { 
      data: [
        { id: 1, name: "PAC (Correios)", company: "Correios", price: 18.50 + (pesoFaturado * 2.30), delivery_time: 7, logo: "https://logodownload.org/wp-content/uploads/2014/05/correios-logo-1-1.png" },
        { id: 2, name: "SEDEX (Correios)", company: "Correios", price: 32.90 + (pesoFaturado * 4.50), delivery_time: 2, logo: "https://logodownload.org/wp-content/uploads/2014/05/correios-logo-1-1.png" },
        { id: 3, name: ".Package", company: "Jadlog", price: 16.20 + (pesoFaturado * 2.10), delivery_time: 6, logo: "https://logodownload.org/wp-content/uploads/2021/03/jadlog-logo-0.png" }
      ]
    }
  }

  // === INTEGRAÇÃO OFICIAL MELHOR ENVIO ===
  try {
    const payload = {
      from: { postal_code: cepOrigem.replace(/\D/g, '') },
      to: { postal_code: cepDestino.replace(/\D/g, '') },
      package: {
        weight: pesoKg || 1,
        width: 20, // Dimensões padrões mínimas (pois ainda não temos isso no cad. produto)
        height: 20,
        length: 20
      },
      options: {
        insurance_value: valorSeguro || 0,
        receipt: false,
        own_hand: false
      }
    }

    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "JC2B ERP (leocosta42@gmail.com)" // Recomendado pela doc do Melhor Envio
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("Melhor Envio API Error:", errText)
      return { error: "Falha ao consultar Melhor Envio. Verifique o Token ou CEPs." }
    }

    const result = await response.json()
    
    // Filtra apenas os que não tem erro e converte para o formato que a nossa tela já entende
    const validOptions = result
      .filter((opt: any) => !opt.error)
      .map((opt: any) => ({
        id: opt.id,
        name: opt.name,
        company: opt.company.name,
        price: parseFloat(opt.price),
        delivery_time: opt.delivery_time,
        logo: opt.company.picture || "https://logodownload.org/wp-content/uploads/2014/05/correios-logo-1-1.png"
      }))
      .sort((a: any, b: any) => a.price - b.price)

    if (validOptions.length === 0) {
      return { error: "Nenhuma transportadora disponível para esta rota." }
    }

    return { data: validOptions }

  } catch (error: any) {
    console.error("Erro requisição Melhor Envio:", error)
    return { error: "Erro interno ao calcular frete." }
  }
}
