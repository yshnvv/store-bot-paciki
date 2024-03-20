import dotenv from "dotenv";
dotenv.config();

export const {
	BOT_TOKEN,
	SHEET_ID,
	GOOGLE_SERVICE_ACCOUNT_EMAIL,
	GOOGLE_PRIVATE_KEY,
	BASE_API,
	SHOPS,
} = process.env;

export const shops = JSON.parse(SHOPS);
export const SHOP_NAMES = Object.keys(shops);
