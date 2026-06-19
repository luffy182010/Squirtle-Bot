const { proto, generateWAMessageFromContent, prepareWAMessageMedia, downloadContentFromMessage } = await import("@whiskeysockets/baileys");

function buildStickerExif(metadata) {
  const json = Buffer.from(JSON.stringify(metadata), "utf-8");
  const exif = Buffer.concat([
    Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]),
    Buffer.alloc(4),
    Buffer.from([0x16, 0x00, 0x00, 0x00]),
    json,
  ]);
  exif.writeUInt32LE(json.length, 14);
  return exif;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const sizeBuffer = Buffer.alloc(4);
  sizeBuffer.writeUInt32LE(data.length, 0);
  const padding = data.length % 2 === 1 ? Buffer.from([0x00]) : Buffer.alloc(0);
  return Buffer.concat([typeBuffer, sizeBuffer, data, padding]);
}

function setWebpExif(webpBuffer, metadata) {
  const chunks = [];
  let offset = 12;
  while (offset + 8 <= webpBuffer.length) {
    const type = webpBuffer.slice(offset, offset + 4).toString();
    const size = webpBuffer.readUInt32LE(offset + 4);
    const chunkEnd = offset + 8 + size + (size % 2);
    if (chunkEnd > webpBuffer.length) break;
    if (type !== "EXIF") chunks.push(webpBuffer.slice(offset, chunkEnd));
    offset = chunkEnd;
  }
  const exifPayload = buildStickerExif(metadata);
  const exifChunk = makeChunk("EXIF", exifPayload);
  const body = Buffer.concat([...chunks, exifChunk]);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0);
  header.writeUInt32LE(body.length + 4, 4);
  header.write("WEBP", 8);
  return Buffer.concat([header, body]);
}

async function downloadStickerBuffer(stickerMessage) {
  const stream = await downloadContentFromMessage(stickerMessage, "sticker");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadMediaWithRetry(conn, buffer, mediaType, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await prepareWAMessageMedia({ [mediaType]: buffer }, { upload: conn.waUploadToServer });
    } catch {
      if (i < retries - 1) await delay(2000 * (i + 1));
      else throw new Error("Upload failed");
    }
  }
}

const fun = async (m, { conn }) => {
  try {
    const stickerData = m.quoted?.message;
    if (!stickerData) {
      await m.reply("لا لازم ملصق");
      return;
    }
    
    const actualMsg = stickerData.ephemeralMessage?.message || stickerData.viewOnceMessage?.message || stickerData;
    const stickerMsg = actualMsg.stickerMessage || actualMsg;
    
    if (!stickerMsg.mimetype || stickerMsg.mimetype !== "image/webp") {
      await m.reply("لا لازم ملصق");
      return;
    }

    const stickerBuffer = await downloadStickerBuffer(stickerMsg);
    if (stickerBuffer.length > 500 * 1024) {
      await m.reply("الملصق كبير جداً");
      return;
    }

    const metadata = {
      "sticker-pack-id": "2be7e369-b5ce-4706-a3d4-f78805a20328",
      "sticker-pack-name": "OMAK",
      "sticker-pack-publisher": "HAI",
      "accessibility-text": "MR ALOC",
      "android-app-store-link": "https://whatsapp.com",
      "ios-app-store-link": "https://whatsapp.com/ios",
      emojis: ["🦸", "😴", "😌"],
      "is-from-sticker-maker": 0,
      "is-avatar-sticker": 0,
      "avatar-sticker-template-id": "whatsapp",
      "is-ai-sticker": 0,
      "is-avatar-country-sticker": 1,
      "is-avatar-instant-sticker": 1,
      "sticker-maker-source-type": 4,
      "is-avatar-social-sticker": 1,
      "avatar-sticker-style": "whatsapp",
      "avatar-sticker-revision-id": "2026",
      "is-from-user-created-pack": 1,
      "origin-pack-id": "whatsapp",
      "is-text-sticker": 1,
      "premium": 1,
    };

    const finalStickerBuffer = setWebpExif(stickerBuffer, metadata);
    const media = await uploadMediaWithRetry(conn, finalStickerBuffer, "sticker");

    const msgContent = {
      messageContextInfo: {
        limitSharingV2: {
          sharingLimited: true,
          trigger: "CHAT_SETTING",
          limitSharingSettingTimestamp: Date.now().toString(),
          initiatedByMe: true,
        },
      },
      stickerMessage: {
        url: media.stickerMessage?.url || "",
        directPath: media.stickerMessage?.directPath || "",
        mediaKey: media.stickerMessage?.mediaKey,
        fileEncSha256: media.stickerMessage?.fileEncSha256,
        fileSha256: media.stickerMessage?.fileSha256,
        fileLength: finalStickerBuffer.length,
        mediaKeyTimestamp: media.stickerMessage?.mediaKeyTimestamp,
        mimetype: "image/webp",
        isAnimated: stickerMsg.isAnimated || false,
        isAvatar: false,
        isAiSticker: false,
        isLottie: false,
        height: stickerMsg.height || 512,
        width: stickerMsg.width || 512,
      },
    };

    const msg = await generateWAMessageFromContent(m.chat, msgContent, {
      quoted: m,
      userJid: conn.user.id,
    });

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

  } catch (e) {
    await m.reply("حدث خطأ: " + e.message);
  }
}

fun.command = ["سبريم"];
export default fun;
