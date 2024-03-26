import axios from "axios";
import { getDeliveryDate, getTimeRange, getEndOfDay } from "../utils/time.js";
import { shops, BASE_API } from "../constants/environment.js";
import { prepareOrdersForSheet, isValidOrder } from "../utils/products.js";

const LIMIT = 1000;

const getUnfulfilledOrders = async (shopId, shopKey) => {
	const { from, to } = getTimeRange();

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

	const products = data.result.postings
		.map((order) => ({
			products: order.products,
			express: order.is_express,
			status: order.status,
			deliveryMethod: order.delivery_method,
			postingNumber: order.posting_number,
			shipmentDate: order.shipment_date,
			id: order.order_id,
		}))
		.filter(({ shipmentDate }) => getEndOfDay().isAfter(shipmentDate));

	return products;
};

const getPackages = async (id, apiKey, shopName, filter) => {
	const orders = await getUnfulfilledOrders(id, apiKey);

	const prepareData = (orders) =>
		orders.map(({ postingNumber, products }) => ({
			postingNumber,
			shopName,
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
						status: order.status,
						shipmentDate: order.shipmentDate,
					})),
				}));

				shopOrders.push(ordersWithColor);
			}

			return prepareOrdersForSheet(shopOrders);
		} catch (err) {
			console.log(err);
		}
	}

	static async prepareOrder(ctx, isExpress) {
		try {
			const filter = (order) =>
				order.status === "awaiting_packaging" && order.express === isExpress;

			for (const [shopName, shop] of Object.entries(shops)) {
				const { id, apiKey } = shop;
				const packages = await getPackages(id, apiKey, shopName, filter);

				const validOrders = packages.filter((order) =>
					isValidOrder(order, ctx)
				);

				if (!validOrders.length) return null;

				for (const { products, postingNumber } of validOrders) {
					await axios.post(
						`${BASE_API}/v4/posting/fbs/ship`,
						{
							packages: [
								{
									products,
								},
							],
							posting_number: postingNumber,
						},
						{
							headers: {
								"Client-Id": id,
								"Api-Key": apiKey,
							},
						}
					);
				}
			}

			return true;
		} catch (err) {
			console.log(err);
		}
	}

	static async prepareFBS(ctx) {
		return this.prepareOrder(ctx, false);
	}

	static async prepareExpress(ctx) {
		try {
			return this.prepareOrder(ctx, true);
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

	static async sendGoods(id, apiKey) {
		try {
			const warehouses = await getWarehouses(id, apiKey);

			const deliveryMethods = await getActiveDeliveryMethodIds(
				id,
				apiKey,
				warehouses
			);

			if (!deliveryMethods.length) {
				return null;
			}

			for (const deliveryMethod of deliveryMethods) {
				const { data } = await axios.post(
					`${BASE_API}/v2/posting/fbs/act/create`,
					{
						delivery_method_id: deliveryMethod,
						departure_date: getDeliveryDate(),
					},
					{
						headers: {
							"Client-Id": id,
							"Api-Key": apiKey,
						},
					}
				);
			}

			return data;
		} catch (err) {
			console.log(err);
		}
	}
}
