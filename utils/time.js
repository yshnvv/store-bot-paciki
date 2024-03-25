import moment from "moment";

const TIMEZONE = 3;

const isNewDay = () => {
	const endOfWorkDay = moment().set("hour", 16).set("minute", 0);
	const endOfDay = moment().add(1, "day").set("hour", 0).set("minute", 0);
	const now = moment().add(TIMEZONE, "hours");

	return now.isBetween(endOfWorkDay, endOfDay);
};

export const getTodayTimeRange = () => {
	if (isNewDay()) {
		return {
			to: moment().add(TIMEZONE, "hours").toISOString(),
			from: moment()
				.set("hour", 16 + 2)
				.set("minute", 0)
				.toISOString(),
		};
	}

	return {
		to: moment().add(TIMEZONE, "hours").toISOString(),
		from: moment()
			.subtract(1, "days")
			.set("hour", 16 + 2)
			.set("minute", 0)
			.toISOString(),
	};
};

export const getCurrentDate = () => {
	return moment().format("DD.MM.YYYY").toString();
};

export const getSheetDate = () => {
	if (isNewDay()) {
		return moment().add(1, "days").format("DD.MM").toString();
	}

	return moment().format("DD.MM").toString();
};

export const getDeliveryDate = () => {
	return moment()
		.set("hour", 16 + 2)
		.set("minute", 0)
		.toISOString();
};

export const ISO2DateTime = (iso) => {
	return moment(iso).format("DD.MM h:mm");
};
