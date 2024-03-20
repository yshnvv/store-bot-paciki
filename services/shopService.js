import axios from "axios";
import { getTodayTimeRange } from "../utils/time.js";
import { shops, BASE_API } from "../constants/environment.js";
import { prepareOrdersForSheet } from "../utils/products.js";

const LIMIT = 1000;

const getUnfulfilledOrders = async (shopId, shopKey) => {
	const { from, to } = getTodayTimeRange();
	const { data } = await axios.post(
		`${BASE_API}/v3/posting/fbs/unfulfilled/list`,
		{
			dir: "asc",
			filter: {
				cutoff_from: from,
				cutoff_to: to,
			},
			limit: LIMIT,
		},
		{
			headers: {
				"Client-Id": shopId,
				"Api-Key": shopKey,
			},
		}
	);

	const products = data.result.postings.map((order) => ({
		products: order.products,
		express: order.is_express,
		status: order.status,
		postingNumber: order.posting_number,
		id: order.order_id,
	}));

	return products;
};

export class ShopService {
	static async getOrderList() {
		try {
			const shopOrders = [];
			for (const shop of Object.values(shops)) {
				const { id, apiKey, color } = shop;
				const orders = await getUnfulfilledOrders(id, apiKey);
				const ordersWithColor = orders.map((order) => ({
					products: order.products.map((product) => ({ ...product, color })),
				}));
				shopOrders.push(ordersWithColor);
			}

			return prepareOrdersForSheet(shopOrders);
		} catch (err) {
			console.log(err);
		}
	}

	static async getFBS() {
		try {
		} catch (err) {
			console.log(err);
		}
	}

	static async getExpress() {
		try {
		} catch (err) {
			console.log(err);
		}
	}

	static async getLabels(id, apiKey) {
		try {
			const orders = await getUnfulfilledOrders(id, apiKey);
			const PostingIDs = orders
				.filter((order) => order.status === "awaiting_deliver")
				.map((order) => order.postingNumber);

			if (!PostingIDs.length) {
				return null;
			}

			const { data } = await axios.post(
				`${BASE_API}/v2/posting/fbs/package-label`,
				{
					posting_number: PostingIDs,
				},
				{
					responseType: "stream",
					headers: {
						"Client-Id": id,
						"Api-Key": apiKey,
						"Content-Type": "application/json",
						Accept: "application/pdf",
					},
				}
			);

			return data;
		} catch (err) {
			console.log(err);
		}
	}

	static async getRefunds(id, apiKey) {
		try {
			const { data } = await axios.post(
				`${BASE_API}/v1/return/giveout/get-png`,
				{},
				{
					headers: {
						"Client-Id": id,
						"Api-Key": apiKey,
					},
				}
			);

			return data.png;
		} catch (err) {
			console.log(err);
		}
	}

	static async shipGoods() {
		try {
		} catch (err) {
			console.log(err);
		}
	}
}
