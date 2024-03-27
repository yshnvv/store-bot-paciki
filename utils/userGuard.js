import { USERS } from "../constants/environment.js";

const users = USERS?.split(",") || [];

export const userGuard = async (ctx, callback) => {
	const callbackId = String(ctx.update.callback_query?.from?.id);
	const messageId = String(ctx.update.message?.from?.id);

	if (users.includes(callbackId) || users.includes(messageId)) {
		await callback();
		return;
	}

	await ctx.reply("Бот вам не доступен.");
};
