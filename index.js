require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');

const bot = new Telegraf(process.env.BOT_TOKEN);
const serpApiKey = process.env.SERPAPI_KEY;

const searchGoogle = async (query, siteFilter = '') => {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        q: query,
        api_key: serpApiKey,
      },
    });

    const results = response.data.organic_results || [];
    return siteFilter ? results.filter(r => r.link.includes(siteFilter)) : results;
  } catch (error) {
    console.error("Erro ao buscar dados do SerpAPI:", error.message);
    return [];
  }
};

function mesParaNumero(mes) {
  const mapa = {
    janeiro: '01', fevereiro: '02', março: '03', abril: '04',
    maio: '05', junho: '06', julho: '07', agosto: '08',
    setembro: '09', outubro: '10', novembro: '11', dezembro: '12'
  };
  return mapa[mes.toLowerCase()] || '??';
}

bot.start((ctx) => ctx.reply(
  `👋 Olá, fã da *FURIA*!\n
Aqui estão os comandos disponíveis:
📌 /lineup – Veja o line-up atual
📆 /jogos – Confira os próximos jogos
📰 /noticias – Últimas notícias e redes sociais
📈 /resultados – Resultados recentes da equipe

Vamos nessa! 🔥`,
  { parse_mode: 'Markdown' }
));

bot.command('lineup', async (ctx) => {
  const results = await searchGoogle("site:draft5.gg/equipe/330-FURIA lineup atual FURIA", 'draft5.gg/equipe/330-FURIA');

  if (results.length === 0) {
    return ctx.reply("❌ Não encontrei informações sobre o line-up no momento.");
  }

  const snippet = results[0].snippet || "";
  const jogadores = snippet.split(";")
    .map(j => j.trim())
    .filter(j => j.length > 0)
    .map(j => `- ${j}`)
    .join("\n");

  const msg = `🎮 *Line-up atual da FURIA:*\n\n${jogadores}\n\n🔗 Fonte: draft5.gg`;
  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('jogos', async (ctx) => {
  const results = await searchGoogle(
    "site:draft5.gg/equipe/330-FURIA/proximas-partidas FURIA proximos jogos",
    'https://draft5.gg/equipe/330-FURIA/proximas-partidas'
  );

  if (results.length === 0) {
    return ctx.reply("❌ Não encontrei jogos no momento.");
  }

  const msg = `⚡ *Próximo jogo da FURIA:*\n\n` + results.slice(0, 1).map(r => {
    const snippet = r.snippet || "Informações sobre o jogo não disponíveis.";
    const dataMatch = snippet.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i);
    const horaMatch = snippet.match(/(\d{2}:\d{2})/);
    const oponenteMatch = snippet.match(/FURIA\s+vs\s+([a-zA-Z\s]+)/i);

    const data = dataMatch ? `${dataMatch[1].padStart(2, '0')}/${mesParaNumero(dataMatch[2])}/${dataMatch[3]}` : "Data desconhecida";
    const hora = horaMatch ? horaMatch[1] : "Hora desconhecida";
    const oponente = oponenteMatch ? oponenteMatch[1] : "Oponente desconhecido";

    return `📅 *Data:* ${data}\n🕐 *Horário:* ${hora}\n🆚 *Partida:* FURIA vs ${oponente}\n\n🔗 Fonte: draft5.gg`;
  }).join('\n\n');

  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('noticias', (ctx) => {
  const msg = `
📰 *Últimas notícias da FURIA:*

Siga as redes sociais oficiais para atualizações, bastidores e anúncios importantes:

🐦 *Twitter:* [@FURIA](https://x.com/FURIA?ref_src=twsrc%5Egoogle%7Ctwcamp%5Eserp%7Ctwgr%5Eauthor)  
📸 *Instagram:* [@FURIA](https://www.instagram.com/furiagg/?hl=en)

Fique por dentro de tudo que rola no CS:GO e muito mais! 🎯
  `;
  ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('resultados', async (ctx) => {
  const results = await searchGoogle(
    "site:draft5.gg/equipe/330-FURIA/resultados FURIA últimos resultados",
    'draft5.gg/equipe/330-FURIA/resultados'
  );

  if (results.length === 0) {
    return ctx.reply("❌ Nenhum resultado recente encontrado.");
  }

  const snippet = results[0].snippet || "Sem informações.";
  const blocos = snippet.split("Resultados.").map(b => b.trim()).filter(b => b.length > 0);

  const formatado = blocos.map(b => {
    try {
      const dataMatch = b.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i);
      const horaMatch = b.match(/(\d{2}:\d{2})/);
      const placarMatch = b.match(/FURIA.*?(\d).*?The MongolZ.*?(\d)/i);
      const campeonatoMatch = b.match(/MD\d\.\s(.+)$/);

      const dia = dataMatch ? `${dataMatch[1].padStart(2, '0')}/${mesParaNumero(dataMatch[2])}/${dataMatch[3]}` : "Data desconhecida";
      const hora = horaMatch ? horaMatch[1] : "Hora desconhecida";
      const placar = placarMatch ? `FURIA ${placarMatch[1]} x ${placarMatch[2]} The MongolZ` : "Placar indisponível";
      const campeonato = campeonatoMatch ? campeonatoMatch[1].trim() : "Campeonato desconhecido";

      return `📅 *${dia}* - 🏆 ${campeonato}\n🆚 ${placar}\n🕐 ${hora}`;
    } catch {
      return `📋 ${b}`;
    }
  }).join('\n\n');

  ctx.reply(`📊 *Últimos resultados da FURIA:*\n\n${formatado}\n\n🔗 Fonte: draft5.gg`, { parse_mode: 'Markdown' });
});

bot.launch();
console.log("Bot está rodando...");
