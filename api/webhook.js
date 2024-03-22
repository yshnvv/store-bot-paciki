import telegraf from "telegraf";
import { GoogleDocService } from "../services/googleDocService.js";
import { ShopService } from "../services/shopService.js";
import { BOT_TOKEN } from "../constants/environment.js";
import { shops, SHEET_ID } from "../constants/environment.js";
import { getCurrentDate } from "../utils/time.js";
import { setWebHook } from "../utils/setWebHook.js";

const { Telegraf, Input } = telegraf;

export const bot = new Telegraf(BOT_TOKEN);

const reply_markup = {
	inline_keyboard: [
		[
			{
				text: "1. Список заказов",
				callback_data: "getOrderList",
			},
		],
		[
			{
				text: "2. Собрать все FBS",
				callback_data: "prepareFBS",
			},
		],
		[
			{
				text: "3. Собрать все Express",
				callback_data: "prepareExpress",
			},
		],
		[
			{
				text: "4. Получить все этикетки",
				callback_data: "getLabels",
			},
		],
		[
			{
				text: "5. Получить возвраты",
				callback_data: "getRefunds",
			},
		],
		[
			{
				text: "6. Отгрузить",
				callback_data: "sendGoods",
			},
		],
	],
};

bot.start(async (ctx) => {
	await ctx.reply("Выберите действие", {
		parse_mode: "MarkdownV2",
		reply_markup,
	});
});

bot.action("getOrderList", async (ctx) => {
	const list = await ShopService.getOrderList();
	await GoogleDocService.updateSheet(list);

	await ctx.reply(
		`Таблица обновлена. \n https://docs.google.com/spreadsheets/d/${SHEET_ID}`
	);
});

bot.action("prepareFBS", async (ctx) => {
	await ShopService.prepareFBS();
	await ctx.reply("Не готово");
});

bot.action("prepareExpress", async (ctx) => {
	await ShopService.prepareExpress();
	await ctx.reply("Не готово");
});

bot.action("getLabels", async (ctx) => {
	for (const [name, { id, apiKey }] of Object.entries(shops)) {
		const labels = await ShopService.getLabels(id, apiKey);

		if (!labels) {
			await ctx.reply(`Бирок для магазина ${name} нет.`);
			continue;
		}

		await ctx.replyWithDocument(
			Input.fromReadableStream(labels, `Бирки ${name} ${getCurrentDate()}.pdf`)
		);
	}
});

bot.action("getRefunds", async (ctx) => {
	for (const [name, { id, apiKey }] of Object.entries(shops)) {
		const refunds = await ShopService.getRefunds(id, apiKey);
		await ctx.replyWithPhoto(Input.fromBuffer(Buffer.from(refunds, "base64")), {
			caption: name,
		});
	}
});

bot.action("sendGoods", async (ctx) => {
	await ShopService.sendGoods();
	await ctx.reply("Не готово");
});

export default async (request, response) => {
	try {
		setWebHook();
		const { body } = request;

		if (body.message || body.callback_query) {
			await bot.handleUpdate(body);
		}
	} catch (error) {
		console.error("Error sending message");
		console.log(error.toString());
	}

	response.send("OK");
};
