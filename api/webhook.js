import telegraf from "telegraf";
import { GoogleDocService } from "../services/googleDocService.js";
import { ShopService } from "../services/shopService.js";
import { BOT_TOKEN } from "../constants/environment.js";
import { shops, SHEET_ID } from "../constants/environment.js";
import { getCurrentDate } from "../utils/time.js";
import { userGuard } from "../utils/userGuard.js";

const { Telegraf, Input, Markup } = telegraf;

export const bot = new Telegraf(BOT_TOKEN);

const startMarkup = Markup.keyboard(["/start"]).oneTime().resize();

const actionsMarkup = {
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
	await userGuard(ctx, async () => {
		await ctx.reply("Выберите действие", {
			parse_mode: "MarkdownV2",
			reply_markup: actionsMarkup,
		});
	});
});

bot.action("getOrderList", async (ctx) => {
	await userGuard(ctx, async () => {
		const list = await ShopService.getOrderList();
		const sheetId = await GoogleDocService.updateSheet(list);

		if (!sheetId) {
			await ctx.reply("Ошибка записи в гуглдок", startMarkup);
			return;
		}

		await ctx.reply(
			`Таблица обновлена. \n https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${sheetId}`,
			startMarkup
		);
	});
});

bot.action("prepareFBS", async (ctx) => {
	await userGuard(ctx, async () => {
		const isPrepared = await ShopService.prepareFBS(ctx);

		if (!isPrepared) {
			await ctx.reply("Нечего отправлять.", startMarkup);
			return;
		}

		await ctx.reply("Товары готовы к отправке.", startMarkup);
	});
});

bot.action("prepareExpress", async (ctx) => {
	await userGuard(ctx, async () => {
		const isPrepared = await ShopService.prepareExpress(ctx);

		if (!isPrepared) {
			await ctx.reply("Нечего отправлять.", startMarkup);
			return;
		}

		await ctx.reply("Товары готовы к отправке.", startMarkup);
	});
});

bot.action("getLabels", async (ctx) => {
	await userGuard(ctx, async () => {
		for (const [name, { id, apiKey }] of Object.entries(shops)) {
			const labels = await ShopService.getLabels(id, apiKey);

			if (!labels) {
				await ctx.reply(`Бирок для магазина ${name} нет.`, startMarkup);
				continue;
			}

			await ctx.replyWithDocument(
				Input.fromReadableStream(
					labels,
					`Бирки ${name} ${getCurrentDate()}.pdf`
				),
				startMarkup
			);
		}
	});
});

bot.action("getRefunds", async (ctx) => {
	await userGuard(ctx, async () => {
		for (const [name, { id, apiKey }] of Object.entries(shops)) {
			const refunds = await ShopService.getRefunds(id, apiKey);
			await ctx.replyWithPhoto(
				Input.fromBuffer(Buffer.from(refunds, "base64")),
				{
					caption: name,
					...startMarkup,
				}
			);
		}
	});
});

bot.action("sendGoods", async (ctx) => {
	await userGuard(ctx, async () => {
		for (const [name, { id, apiKey }] of Object.entries(shops)) {
			const result = await ShopService.sendGoods(id, apiKey);

			if (!result) {
				await ctx.reply(`${name} без методов доставки.`, startMarkup);
			}

			await ctx.reply(`${name} отгружен.`, startMarkup);
		}
	});
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
