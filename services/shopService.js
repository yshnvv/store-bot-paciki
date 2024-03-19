import axios from "axios";
import dotenv from "dotenv";
import moment from "moment";
dotenv.config();

const { BASE_API, API_KEY, SHOPS_ID } = process.env;
const shops = SHOPS_ID.split(",");

// const LIMIT = 1000;

// const getOrders = async (shopId, shopKey) => {
// 	const { data } = await axios.post(
// 		`${BASE_API}/v3/posting/fbs/unfulfilled/list`,
// 		{
// 			dir: "asc",
// 			filter: {
// 				cutoff_from: "2024-02-18T14:15:22Z",
// 				cutoff_to: "2024-03-18T14:15:22Z",
// 			},
// 			limit: LIMIT,
// 		},
// 		{
// 			headers: {
// 				"Client-Id": shops[0],
// 				"Api-Key": API_KEY,
// 			},
// 		}
// 	);

// 	const products = data.result.postings.map((order) => ({
// 		product: order.products[0],
// 		express: order.is_express,
// 		id: order.order_id,
// 	}));

// 	return products;
// };

export class ShopService {
	static async getOrderList() {
		try {
			const date = new Date();
			console.log(date.to);
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

	static async getLabels() {
		try {
			const { data } = await axios.post(
				`${BASE_API}/v1/return/giveout/get-png`,
				{},
				{
					headers: {
						"Client-Id": shops[0],
						"Api-Key": API_KEY,
					},
				}
			);

			return data.png;
		} catch (err) {
			console.log(err);
		}
	}

	static async getRefunds() {
		try {
			const { data } = await axios.post(
				`${BASE_API}/v1/return/giveout/get-png`,
				{},
				{
					headers: {
						"Client-Id": shops[0],
						"Api-Key": API_KEY,
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
