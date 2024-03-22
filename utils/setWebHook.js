import axios from "axios";
import { BOT_TOKEN, BOT_DOMAIN } from "../constants/environment.js";

export const setWebHook = () => {
	let isSet = false;
	return async () => {
		if (!isSet && BOT_DOMAIN && BOT_TOKEN) {
			await axios.get(
				`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=https://${BOT_DOMAIN}/api/webhook`
			);
			console.log(`---------------WEBHOOK IS READY-------------------`);
			isSet = true;
		}
	};
};
