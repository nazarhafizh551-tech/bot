const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

let sent = new Set();

async function checkUGC() {
  console.log("🌐 Checking UGC...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://www.rolimons.com/marketplace/new-ugc", {
    waitUntil: "domcontentloaded"
  });

  const items = await page.evaluate(() => {
    const data = [];

    document.querySelectorAll("a").forEach(el => {
      const href = el.getAttribute("href");

      if (href && href.includes("/item/")) {
        const name = el.innerText.trim();

        if (name.length > 3) {
          data.push({
            name,
            link: "https://www.rolimons.com" + href
          });
        }
      }
    });

    return data;
  });

  await browser.close();

  console.log("📦 Items:", items.length);

  const channel = await client.channels.fetch(CHANNEL_ID);

  for (const item of items.slice(0, 5)) {
    if (!sent.has(item.link)) {

      const embed = new EmbedBuilder()
        .setTitle(item.name)
        .setURL(item.link)
        .setDescription("🆕 New UGC detected")
        .setColor(0x00ff99);

      await channel.send({
        content: "🚨 NEW UGC!",
        embeds: [embed]
      });

      sent.add(item.link);
    }
  }
}

client.once("ready", () => {
  console.log("✅ Bot aktif");

  setInterval(checkUGC, 20000);
});

client.login(TOKEN);
