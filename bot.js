const express = require("express");
const Jsoning = require("jsoning").default;
const { Telegraf } = require("telegraf");

const app = express();
const bot = new Telegraf("7313927970:AAF3bgeO76QYaj1BbHTlY8CRemqqA3eRYJc");
const db = new Jsoning("db.json");

app.use(express.json());

let state = {};

bot.start(async (ctx) => {
  const chatId = String(ctx.message.chat.id);
  ctx.reply("Salom botga xush kelibsiz");

  const hasUser = await db.has(chatId);

  if (!hasUser) {
    ctx.reply("Iltimos ismingizni kiriting ...");
    state[chatId] = "waiting_for_name";
  } else {
    const userData = await db.get(chatId);
    ctx.reply(`Yaxshimisiz ${userData.name} ?`);
  }
});

bot.on("text", async (ctx) => {
  const chatId = String(ctx.message.chat.id);
  const text = ctx.message.text;

  if (state[chatId] === "waiting_for_name") {
    await db.set(chatId, { name: text, createdAt: new Date().toISOString() });
    ctx.reply(`${text} Siz ma'lumotlar bazamizga muvaffaqiyatli qo'shildingiz`);

    delete state[chatId];
  } else {
    ctx.reply(`echo ${text}`);
  }
});

app.post("/webhook", (req, res) => {
  const update = req.body;

  if (update) {
    bot.handleUpdate(update);
  }

  res.status(200).send("OK");
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`App running on ${PORT} port`);
});

// bot
//   .launch()
//   .then(() => console.log("BOT STARTED!"))
//   .catch((e) => console.error(e));

// process.once("SIGINT", () => bot.stop("SIGINT"));
// process.once("SIGTERM", () => bot.stop("SIGTERM"));
