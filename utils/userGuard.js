import { USERS } from "../constants/environment.js";

export const userGuard = async (ctx, callback) => {
	const callbackId = ctx.update.callback_query?.from?.id;
	const messageId = ctx.update.message?.from?.id;

	if (USERS.includes(callbackId) || USERS.includes(messageId)) {
		await callback();
		return;
	}

	await ctx.reply("Бот вам не доступен.");
};
