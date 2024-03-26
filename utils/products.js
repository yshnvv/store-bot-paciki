import { ISO2DateTime } from "./time.js";

const NUMBER_OF_ORDERS = 8;

const isPotentialScammer = (numberOfOrders) => {
	for (let i = 1; i <= NUMBER_OF_ORDERS; i++) {
		if ("000" + i === numberOfOrders) return true;
	}

	return false;
};

const toManyProducts = (products) => {
	let overallQuantity = 0;

	for (const { quantity } of products) {
		overallQuantity += quantity;
	}

	return {
		overallQuantity,
		overload: overallQuantity >= 5,
	};
};

export const isValidOrder = (order, ctx) => {
	const { postingNumber, products, shopName } = order;
	const numberOfOrders = postingNumber.split("-")[1];
	const { overallQuantity, overload } = toManyProducts(products);

	if (isPotentialScammer(numberOfOrders) && overload) {
		ctx.reply(
			`Возможный скаммер и не могу разделить ${overallQuantity} товаров в ${order.postingNumber}.
			\nМагазин ${shopName}`
		);
		return false;
	}

	if (isPotentialScammer(numberOfOrders)) {
		ctx.reply(
			`Возможный скаммер в ${order.postingNumber}.
			\nМагазин ${shopName}`
		);
		return false;
	}

	if (overload) {
		ctx.reply(
			`Не могу разделить ${overallQuantity} товаров в ${order.postingNumber}.
			\nМагазин ${shopName}`
		);
		return false;
	}

	return true;
};

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
						status: product.status,
					});
				}
			});
		});
	});

	return result;
};
