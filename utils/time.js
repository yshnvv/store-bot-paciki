import moment from "moment";

const TIMEZONE = 3;

export const getTodayTimeRange = () => {
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
