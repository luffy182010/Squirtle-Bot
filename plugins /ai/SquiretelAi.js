import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("🔴 ~ حط نص جنب الأمر ~ 🐢");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender, "https://qu.ax/x/yfxdM.jpg"),
    text: "```⏳ جـاري تـجـهـيـز الـرد يـا صـديـقـي,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [سكويرتيل، Squiretel] تجسيد لـ شخصية Squiretel من مسلسل [Pokémon] وتكلم بـ لجهة مصرية
طريقة كلامك: هادئة، عاقلة، بتفكر قبل ما تتكلم، متزنة، بتحلل الموقف، بتدي نصائح عملية، صوتك واطي ومطمن
و انا اسمي هيكون [ ${m.name || "مز"} ] 
رد علي رسالتي دي:
${text}
`;

  const { data: res } = await Scrapy.ZeroAI(text, prompt);

  await conn.sendMessage(m.chat, {
    text: res.answer,
    edit: loadingMsg.key,
    contextInfo: context(m.sender, "https://qu.ax/x/yfxdM.jpg")
  });
};

handler.usage = ["سكويرتيل"];
handler.category = "ai";
handler.command = ["سكويرتيل", "Squiretel"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363225356834044@newsletter',
        newsletterName: '𝐒𝐐𝗨𝐈𝐑𝐄𝐓𝐄𝐋 ~ 𝐏𝐎𝐊é𝐌𝐎𝐍 🐢',
        serverMessageId: 0
    },
    externalAdReply: {
        title: "𝐏𝐎𝐊é𝐌𝐎𝐍",
        body: "𝚃𝚊𝚔𝚎 𝚊 𝚍𝚎𝚎𝚙 𝚋𝚛𝚎𝚊𝚝𝚑 ~ ☆ 𝙻𝚎𝚝'𝚜 𝚝𝚑𝚒𝚗𝚔 𝚝𝚘𝚐𝚎𝚝𝚑𝚎𝚛",
        thumbnailUrl: img,
        sourceUrl: '',
        mediaType: 1,
        renderLargerThumbnail: true
    }
});
