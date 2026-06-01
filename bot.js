const express = require("express");
const Jsoning = require("jsoning").default;
const { Telegraf } = require("telegraf");
const path = require("path");
const fs = require("fs");

const app = express();
const bot = new Telegraf("7313927970:AAF3bgeO76QYaj1BbHTlY8CRemqqA3eRYJc");
const db = new Jsoning("db.json");

const BACKUP_CHAT_ID = 6760329131;

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

app.get("/backup", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "db.json");

    if (fs.existsSync(filePath)) {
      await bot.telegram.sendDocument(
        BACKUP_CHAT_ID,
        {
          source: filePath,
          filename: `backup-${new Date().toISOString().slice(0, 10)}.json`,
        },
        {
          caption: `🗄 Ma'lumotlar bazasi nusxasi\nVaqt: ${new Date().toLocaleTimeString("uz-UZ", { timeZone: "Asia/Tashkent" })}`,
        },
      );

      return res.status(200).send("Backup yuborildi va Render uyg'oq!");
    } else {
      // TO'G'RILANDI: Agar fayl topilmasa ham Express javob qaytarishi shart!
      return res
        .status(200)
        .send("db.json fayli hali yaratilmagan, lekin Render uyg'oq!");
    }
  } catch (error) {
    console.error(`Backup error ${error}`);
    // Xatolik bo'lsa ham 200 qaytaramiz, shunda cron-job xizmati server o'ldi deb hisoblamaydi
    return res.status(200).send("Xatolik bo'ldi, lekin Render uyg'oq!");
  }
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
