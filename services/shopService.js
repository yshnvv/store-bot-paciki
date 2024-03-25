import axios from "axios";
import { getTodayTimeRange, getDeliveryDate } from "../utils/time.js";
import { shops, BASE_API } from "../constants/environment.js";
import { prepareOrdersForSheet } from "../utils/products.js";

const LIMIT = 1000;

const getUnfulfilledOrders = async (shopId, shopKey) => {
	const { from, to } = getTodayTimeRange();

	const { data } = await axios.post(
		`${BASE_API}/v3/posting/fbs/list`,
		{
			dir: "asc",
			filter: {
				since: from,
				to: to,
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

const getPackages = async (id, apiKey, filter) => {
	const orders = await getUnfulfilledOrders(id, apiKey);
	console.log(JSON.stringify(orders));
	const prepareData = (orders) =>
		orders.map(({ postingNumber, products }) => ({
			postingNumber,
			products: products.map(({ sku, quantity }) => ({
				product_id: sku,
				quantity,
			})),
		}));

	if (filter) {
		return prepareData(orders.filter(filter));
	}

	return prepareData(orders);
};

const getWarehouses = async (id, apiKey) => {
	const { data } = await axios.post(
		`${BASE_API}/v1/warehouse/list`,
		{},
		{
			headers: {
				"Client-Id": id,
				"Api-Key": apiKey,
			},
		}
	);

	return data.result.map(({ warehouse_id }) => warehouse_id);
};

const getDeliveryMethodList = async (id, apiKey, warehouse) => {
	const { data } = await axios.post(
		`${BASE_API}/v1/delivery-method/list`,
		{
			filter: {
				warehouse_id: warehouse,
			},
			offset: 0,
			limit: LIMIT,
		},
		{
			headers: {
				"Client-Id": id,
				"Api-Key": apiKey,
			},
		}
	);

	return data.result;
};

const getActiveDeliveryMethodIds = async (id, apiKey, warehouses) => {
	let result = [];

	for (const warehouse of warehouses) {
		const deliveryMethods = await getDeliveryMethodList(id, apiKey, warehouse);
		const deliveryMethodsIds = deliveryMethods
			.filter(({ status }) => status === "ACTIVE")
			.map(({ id }) => id);

		result.push(...deliveryMethodsIds);
	}

	return result;
};

export class ShopService {
	static async getOrderList() {
		try {
			const shopOrders = [];
			const statuses = ["awaiting_packaging", "awaiting_deliver"];

			for (const shop of Object.values(shops)) {
				const { id, apiKey, color } = shop;

				const orders = await getUnfulfilledOrders(id, apiKey);
				const filteredOrders = orders.filter(({ status }) =>
					statuses.includes(status)
				);

				const ordersWithColor = filteredOrders.map((order) => ({
					products: order.products.map((product) => ({
						...product,
						color,
						postingNumber: order.postingNumber,
					})),
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
			const { id, apiKey } = shops["POINT."];
			const packages = await getPackages(id, apiKey);

			// if (!packages.length) return null;

			// const { data } = await axios.post(
			// 	`${BASE_API}/v4/posting/fbs/ship`,
			// 	{
			// 		packages: [
			// 			{
			// 				products,
			// 			},
			// 		],
			// 		posting_number: postingNumber,
			// 	},
			// 	{
			// 		headers: {
			// 			"Client-Id": id,
			// 			"Api-Key": apiKey,
			// 		},
			// 	}
			// );

			// for (const shop of Object.values(shops)) {
			// 	const { id, apiKey } = shop;
			// 	const filter = (order) =>
			// 		order.status !== "awaiting_deliver" && !order.express;
			// 	const postingNumbers = await getPackages(id, apiKey, filter);
			// }
		} catch (err) {
			console.log(err);
		}
	}

	static async prepareExpress() {
		try {
			// const filter = (order) =>
			// 	order.status !== "awaiting_deliver" && order.express;
			// const postingNumbers = await getPackages(id, apiKey, filter);
			// console.log(postingNumbers);
		} catch (err) {
			console.log(err);
		}
	}

	static async getLabels(id, apiKey) {
		try {
			const orders = await getUnfulfilledOrders(id, apiKey);
			const postingNumbers = orders
				.filter(({ status }) => status === "awaiting_deliver")
				.map(({ postingNumber }) => postingNumber);

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
			// for (const shop of Object.values(shops)) {
			// 	const { id, apiKey } = shop;

			// 	const warehouses = await getWarehouses(id, apiKey);

			// 	const deliveryMethods = await getActiveDeliveryMethodIds(
			// 		id,
			// 		apiKey,
			// 		warehouses
			// 	);

			// 	console.log(deliveryMethods);
			// }

			const { id, apiKey } = shops["POINT."];
			const warehouses = await getWarehouses(id, apiKey);

			const deliveryMethods = await getActiveDeliveryMethodIds(
				id,
				apiKey,
				warehouses
			);

			// const { data } = await axios.post(
			// 	`${BASE_API}/v2/posting/fbs/act/create`,
			// 	{
			// 		containers_count: 1,
			// 		delivery_method_id: deliveryMethods[0],
			// 		departure_date: getDeliveryDate(),
			// 	},
			// 	{
			// 		headers: {
			// 			"Client-Id": shopId,
			// 			"Api-Key": shopKey,
			// 		},
			// 	}
			// );
		} catch (err) {
			console.log(err);
		}
	}
}
