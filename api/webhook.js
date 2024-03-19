import dotenv from "dotenv";
import telegraf from "telegraf";
import { GoogleDocService } from "../services/googleDocService.js";
import { ShopService } from "../services/shopService.js";

dotenv.config();

const { Telegraf, Input } = telegraf;

export const bot = new Telegraf(process.env.BOT_TOKEN);

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
				callback_data: "getFBS",
			},
		],
		[
			{
				text: "3. Собрать все Express",
				callback_data: "getExpress",
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
				callback_data: "shipGoods",
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
	await ShopService.getOrderList();
	// await GoogleDocService.updateSheet([{ name: "Jenya" }]);

	// await ctx.reply("Таблица сформирована");
});

bot.action("getFBS", async (ctx) => {
	await ShopService.getFBS();
	await ctx.reply("FBS получены");
});

bot.action("getExpress", async (ctx) => {
	await ShopService.getExpress();
	await ctx.reply("Экпресы получены");
});

bot.action("getLabels", async (ctx) => {
	const labels = await ShopService.getLabels();
	await ctx.replyWithPhoto({ source: Buffer.from(labels, "base64") });
});

bot.action("getRefunds", async (ctx) => {
	const refunds = await ShopService.getRefunds();
	await ctx.replyWithPhoto({ source: Buffer.from(refunds, "base64") });
});

bot.action("shipGoods", async (ctx) => {
	await ShopService.shipGoods();
	await ctx.reply("Товары отгружены");
});

export default async (request, response) => {
	try {
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
