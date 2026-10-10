import { Telegraf } from 'telegraf';
import { processTool } from './processor.js';
import { readTools } from './storage.js';

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;

/**
 * Initializes and starts the Telegram Bot using Telegraf.
 * Does not crash if TELEGRAM_BOT_TOKEN is missing.
 */
export function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.trim() === '') {
    console.warn('[Telegram Bot] TELEGRAM_BOT_TOKEN is missing in .env. Telegram bot disabled.');
    return null;
  }

  const bot = new Telegraf(token.trim());

  // Command: /start
  bot.command('start', (ctx) => {
    ctx.reply(
      `🤖 *AI Tool Memory Bot*\n\n` +
      `Send or paste any AI tool URL here, and I'll analyze, categorize, and store it in your AI Tool Memory system!\n\n` +
      `Available commands:\n` +
      `/list - View recently saved tools\n` +
      `/stats - View category statistics\n` +
      `/help - Instructions and tips`,
      { parse_mode: 'Markdown' }
    );
  });

  // Command: /help
  bot.command('help', (ctx) => {
    ctx.reply(
      `💡 *How to use AI Tool Memory Bot*\n\n` +
      `1. Copy any AI tool link from YouTube, Instagram, X/Twitter, or blogs.\n` +
      `2. Send the link directly in this chat (e.g. \`https://gamma.app\`).\n` +
      `3. Gemini AI will analyze the site, extract details, and store it locally.\n` +
      `4. Access your saved tools anytime via the Chrome Extension!`,
      { parse_mode: 'Markdown' }
    );
  });

  // Command: /list
  bot.command('list', async (ctx) => {
    try {
      const tools = await readTools();
      if (tools.length === 0) {
        return ctx.reply('📭 Your AI Tool Memory is currently empty. Send me a URL to save your first tool!');
      }

      const recent = tools.slice(0, 5);
      let text = `📚 *Saved AI Tools (${tools.length} total)*\n\n*Recent tools:*\n`;
      recent.forEach((t, i) => {
        text += `${i + 1}. [${t.name}](${t.url}) - \`${t.category}\`\n_${t.description}_\n\n`;
      });

      if (tools.length > 5) {
        text += `_...and ${tools.length - 5} more tools in your extension._`;
      }

      ctx.reply(text, { parse_mode: 'Markdown', disable_web_page_preview: true });
    } catch (err) {
      ctx.reply('❌ Failed to retrieve tool list.');
    }
  });

  // Command: /stats
  bot.command('stats', async (ctx) => {
    try {
      const tools = await readTools();
      if (tools.length === 0) {
        return ctx.reply('📭 No tool statistics available yet.');
      }

      const categories = {};
      tools.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + 1;
      });

      let text = `📊 *AI Tool Memory Statistics*\n\nTotal Tools: *${tools.length}*\n\n*Category Breakdown:*\n`;
      Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, count]) => {
          text += `• ${cat}: *${count}*\n`;
        });

      ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
      ctx.reply('❌ Failed to calculate statistics.');
    }
  });

  // Message Handler: Auto-detect plain URLs
  bot.on('text', async (ctx) => {
    const messageText = ctx.message.text;
    
    // Ignore command messages
    if (messageText.startsWith('/')) return;

    const matches = messageText.match(URL_REGEX);
    if (!matches || matches.length === 0) {
      return ctx.reply('💡 Please send a valid AI tool URL (e.g., https://gamma.app)');
    }

    const targetUrl = matches[0];
    
    const statusMsg = await ctx.reply(`🔍 *Analyzing tool:* \`${targetUrl}\`...`, { parse_mode: 'Markdown' });

    try {
      const result = await processTool(targetUrl, 'telegram');

      const tool = result.tool;
      const tagsText = tool.tags && tool.tags.length > 0
        ? tool.tags.join(' · ')
        : tool.category;

      if (result.isDuplicate) {
        const dupText = 
          `⚠️ *Already Saved*\n\n` +
          `*${tool.name}* is already present in your AI Tool Memory.\n\n` +
          `*Category:* ${tool.category}\n` +
          `*Description:* ${tool.description}\n` +
          `*Link:* ${tool.url}`;

        ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          dupText,
          { parse_mode: 'Markdown', disable_web_page_preview: true }
        );
      } else {
        const successText = 
          `✅ *Tool Saved*\n\n` +
          `*Name:* ${tool.name}\n` +
          `*Category:* ${tool.category}\n` +
          `*Description:* ${tool.description}\n\n` +
          `*Tags:*\n${tagsText}\n\n` +
          `*Source:* Telegram`;

        ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          successText,
          { parse_mode: 'Markdown', disable_web_page_preview: true }
        );
      }
    } catch (err) {
      console.error('[Telegram Bot] Processing error:', err);
      ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `❌ *Error Saving Tool*\n\n${err.message || 'Unable to process the URL.'}`,
        { parse_mode: 'Markdown' }
      );
    }
  });

  bot.launch().then(() => {
    console.log('🤖 Telegram Bot successfully connected and listening for messages!');
  }).catch((err) => {
    console.error('❌ Failed to start Telegram Bot:', err.message);
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));

  return bot;
}
