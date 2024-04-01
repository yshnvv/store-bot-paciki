import moment from "moment";

const TIMEZONE = 3;
const DAYS_RANGE = 3;

export const getEndOfDay = () =>
	moment()
		.set("hour", 16 + 2)
		.set("minute", 0);

export const getTimeRange = () => {
	return {
		to: moment().add(TIMEZONE, "hours").toISOString(),
		from: moment()
			.subtract(DAYS_RANGE, "days")
			.set("hour", 16 + 2)
			.set("minute", 0)
			.toISOString(),
	};
};

export const getCurrentDate = () => {
	return moment().format("DD.MM.YYYY").toString();
};

export const getSheetDate = () => {
	return moment().format("DD.MM").toString();
};

export const getDeliveryDate = () => {
	return moment()
		.set("hour", 16 + 2)
		.set("minute", 0)
		.toISOString();
};

export const ISO2DateTime = (iso) => {
	return moment(iso).format("DD.MM");
};
