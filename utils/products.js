import { ISO2DateTime } from "./time.js";

export const prepareOrdersForSheet = (data) => {
	const result = [];

	data.forEach((shop) => {
		shop.forEach((order) => {
			order.products.forEach((product) => {
				for (let i = 0; i < product.quantity; i++) {
					result.push({
						name: product.offer_id,
						color: product.color,
						postingNumber: product.postingNumber,
						shipmentDate: ISO2DateTime(product.shipmentDate),
					});
				}
			});
		});
	});

	return result;
};
