import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const { BASE_API, API_KEY, SHOPS_ID } = process.env;
const shops = SHOPS_ID.split(",");

export class ShopService {
	static async getOrderList() {
		try {
			const { data } = await axios.post(
				`${BASE_API}/v1/pricing-strategy/competitors/list`,
				{
					page: 1,
					limit: 31,
				},
				{
					headers: {
						"Client-Id": shops[0],
						"Api-Key": API_KEY,
					},
				}
			);

			console.log(data);
		} catch (err) {
			console.log(err);
		}
	}

	static async getFBS() {}

	static async getExpress() {}

	static async getLabels() {}

	static async getRefunds() {}

	static async shipGoods() {}
}
