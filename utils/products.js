export const prepareOrdersForSheet = (data) => {
	const result = [];

	data.forEach((shop) => {
		shop.forEach((order) => {
			order.products.forEach((product) => {
				for (let i = 0; i < product.quantity; i++) {
					result.push({ name: product.name, color: product.color });
				}
			});
		});
	});

	return result;
};
