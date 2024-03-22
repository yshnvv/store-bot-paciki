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
		deliveryMethod: order.delivery_method,
		postingNumber: order.posting_number,
		id: order.order_id,
	}));

	return products;
};

const getPostingNumbers = async (id, apiKey, filter) => {
	const orders = await getUnfulfilledOrders(id, apiKey);

	if (filter) {
		return orders.filter(filter).map((order) => order.postingNumber);
	}

	return orders.map((order) => order.postingNumber);
};

export class ShopService {
	static async getOrderList() {
		try {
			const shopOrders = [];
			const statuses = [
				"awaiting_registration",
				"acceptance_in_progress",
				"awaiting_approve",
				"awaiting_packaging",
				"awaiting_deliver",
			];

			for (const shop of Object.values(shops)) {
				const { id, apiKey, color } = shop;

				const orders = await getUnfulfilledOrders(id, apiKey);
				const filteredOrders = orders.filter(({ status }) =>
					statuses.includes(status)
				);

				const ordersWithColor = filteredOrders.map((order) => ({
					products: order.products.map((product) => ({ ...product, color })),
				}));

				shopOrders.push(ordersWithColor);
			}

			return prepareOrdersForSheet(shopOrders);
		} catch (err) {
			console.log(err);
		}
	}

	static async prepareFBS() {
		try {
			// for (const shop of Object.values(shops)) {
			// 	const { id, apiKey } = shop;
			// 	const filter = (order) =>
			// 		order.status !== "awaiting_deliver" && !order.express;
			// 	const postingNumbers = await getPostingNumbers(id, apiKey, filter);
			// }
		} catch (err) {
			console.log(err);
		}
	}

	static async prepareExpress() {
		try {
			// const filter = (order) =>
			// 	order.status !== "awaiting_deliver" && order.express;
			// const postingNumbers = await getPostingNumbers(id, apiKey, filter);
			// console.log(postingNumbers);
		} catch (err) {
			console.log(err);
		}
	}

	static async getLabels(id, apiKey) {
		try {
			const filter = (order) => order.status === "awaiting_deliver";
			const postingNumbers = await getPostingNumbers(id, apiKey, filter);

			if (!postingNumbers.length) {
				return null;
			}

			const { data } = await axios.post(
				`${BASE_API}/v2/posting/fbs/package-label`,
				{
					posting_number: postingNumbers,
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

	static async sendGoods() {
		try {
		} catch (err) {
			console.log(err);
		}
	}
}
