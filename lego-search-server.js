// ============================================================
// SERVIDOR DE BUSCA LEGO - Busca automática em BrickLink + eBay
// ============================================================
// Instale com: npm install express cors node-fetch cheerio dotenv
// Rode com: node lego-search-server.js
// ============================================================

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================================
// BUSCAR EM BRICKLINK (Web Scraping simples)
// ============================================================
async function searchBrickLink(setNumber) {
  try {
    // BrickLink Price Guide - simulado com fetch
    const url = `https://www.bricklink.com/catalogPG.asp?itemID=${setNumber}`;
    
    // Nota: Em produção, você precisaria de Cheerio para fazer parsing real
    // Por enquanto, retorna estrutura correta que o app espera
    
    return {
      fonte: 'BrickLink',
      numero: setNumber,
      preco: Math.floor(Math.random() * 800) + 50, // Simulado
      condicao: 'Novo',
      vendidos: Math.floor(Math.random() * 50) + 5
    };
  } catch (error) {
    console.log('Erro ao buscar BrickLink:', error.message);
    return null;
  }
}

// ============================================================
// BUSCAR EM EBAY (Últimas vendas)
// ============================================================
async function searchEBay(setNumber) {
  try {
    // eBay - busca simulada
    // Em produção: usar eBay API oficial ou web scraping
    
    return {
      fonte: 'eBay',
      numero: setNumber,
      preco: Math.floor(Math.random() * 900) + 60,
      ultimasVendas: Math.floor(Math.random() * 30) + 2,
      tendencia: Math.random() > 0.5 ? 'subindo' : 'estavel'
    };
  } catch (error) {
    console.log('Erro ao buscar eBay:', error.message);
    return null;
  }
}

// ============================================================
// BUSCAR NO SITE OFICIAL LEGO
// ============================================================
async function searchLego(setName) {
  try {
    // LEGO.com - busca simulada
    // Em produção: fazer fetch real + parsing
    
    return {
      fonte: 'LEGO.com',
      nome: setName,
      status: 'Descontinuado',
      anoLancamento: 2015 + Math.floor(Math.random() * 10)
    };
  } catch (error) {
    console.log('Erro ao buscar LEGO.com:', error.message);
    return null;
  }
}

// ============================================================
// FUNÇÃO CONSOLIDAR RESULTADOS
// ============================================================
function consolidarResultados(bricklink, ebay, lego) {
  const precos = [];
  
  if (bricklink) precos.push(bricklink.preco);
  if (ebay) precos.push(ebay.preco);
  
  const precoMedio = precos.length > 0 
    ? Math.round(precos.reduce((a, b) => a + b) / precos.length)
    : null;
  
  const precoMin = precos.length > 0 ? Math.min(...precos) : null;
  const precoMax = precos.length > 0 ? Math.max(...precos) : null;

  // Determinar raridade baseado em vendas/preço
  let raridade = 'Comum';
  if (precoMedio > 500) raridade = 'Extremamente Raro';
  else if (precoMedio > 300) raridade = 'Muito Raro';
  else if (precoMedio > 150) raridade = 'Raro';
  
  return {
    sucesso: true,
    precoMedio: precoMedio,
    precoMinimo: precoMin,
    precoMaximo: precoMax,
    raridade: raridade,
    fontes: {
      bricklink: bricklink,
      ebay: ebay,
      lego: lego
    },
    recomendacao: precoMedio > 200 ? 'Guardar/Investir' : 'Vender ou Exibir'
  };
}

// ============================================================
// ENDPOINT PRINCIPAL: /search
// ============================================================
app.post('/search', async (req, res) => {
  try {
    const { numero, nome } = req.body;
    
    if (!numero && !nome) {
      return res.status(400).json({ 
        erro: 'Informe número do set ou nome' 
      });
    }

    // Executar buscas em paralelo
    const [bricklink, ebay, lego] = await Promise.all([
      numero ? searchBrickLink(numero) : Promise.resolve(null),
      numero ? searchEBay(numero) : Promise.resolve(null),
      nome ? searchLego(nome) : Promise.resolve(null)
    ]);

    const resultado = consolidarResultados(bricklink, ebay, lego);
    
    res.json(resultado);
  } catch (error) {
    console.error('Erro no endpoint /search:', error);
    res.status(500).json({ 
      erro: 'Erro ao buscar informações',
      detalhes: error.message
    });
  }
});

// ============================================================
// ENDPOINT: /health (verificar se servidor está vivo)
// ============================================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  🧱 SERVIDOR DE BUSCA LEGO INICIADO                ║
╠════════════════════════════════════════════════════╣
║  Servidor rodando em: http://localhost:${PORT}              ║
║  Endpoint de busca: POST /search                   ║
║  Health check: GET /health                         ║
║                                                    ║
║  COMO USAR:                                        ║
║  curl -X POST http://localhost:3000/search \\      ║
║    -H "Content-Type: application/json" \\          ║
║    -d '{"numero":"71040"}'                        ║
╚════════════════════════════════════════════════════╝
  `);
});

// ============================================================
// TRATAMENTO DE ERROS
// ============================================================
process.on('unhandledRejection', (err) => {
  console.error('Erro não tratado:', err);
});
