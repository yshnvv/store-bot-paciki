import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import {
	SHEET_ID,
	GOOGLE_SERVICE_ACCOUNT_EMAIL,
	GOOGLE_PRIVATE_KEY,
} from "../constants/environment.js";
import { getSheetDate } from "../utils/time.js";

const serviceAccountAuth = new JWT({
	email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: GOOGLE_PRIVATE_KEY,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const COLOR_MAX = 256;

const COLUMNS = 7;
const ROWS = 400;
const RANGE = `A1:G${ROWS}`;

const NUMBER_COLUMN = "№";
const NAME_COLUMN = "Наименование";
const DATE_COLUMN = "Дата отгрузки";
const PRICE_COLUMN = "Цена";
const STATUS_COLUMN = "Статус";
const POSTING_NUMBER_COLUMN = "Номер заказа";

const getColor = (color) => {
	return COLOR_MAX - color;
};

const headerColor = {
	red: getColor(158),
	green: getColor(196),
	blue: getColor(232),
};

const prepareHeader = async (sheet) => {
	sheet.setHeaderRow([
		NUMBER_COLUMN,
		NAME_COLUMN,
		DATE_COLUMN,
		"",
		PRICE_COLUMN,
		STATUS_COLUMN,
		POSTING_NUMBER_COLUMN,
	]);

	for (let i = 0; i < COLUMNS; i++) {
		const cell = sheet.getCell(0, i);
		cell.textFormat = { bold: true };
		cell.backgroundColor = headerColor;
	}

	await sheet.updateDimensionProperties(
		"COLUMNS",
		{ hiddenByUser: true },
		{ startIndex: 3, endIndex: 4 }
	);
};

export class GoogleDocService {
	static async updateSheet(data) {
		try {
			const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
			await doc.loadInfo();

			const sheetDate = getSheetDate();
			let sheet = doc.sheetsByTitle[sheetDate];

			if (!sheet) {
				sheet = await doc.addSheet({ title: sheetDate });
			}

			await sheet.clear(`A1:C400`);
			await sheet.clear(`G1:G400`);
			await sheet.loadCells(RANGE);

			for (let i = 1; i < ROWS; i++) {
				for (let j = 0; j < COLUMNS; j++) {
					const cell = sheet.getCell(i, j);
					cell.clearAllFormatting();
				}
			}
			await sheet.saveUpdatedCells();

			prepareHeader(sheet);

			for (let i = 0; i < data.length; i++) {
				for (let j = 0; j < COLUMNS; j++) {
					const cell = sheet.getCell(i + 1, j);

					if (j === 0) {
						cell.value = i + 1;
					}

					if (j === 1) {
						const { red, green, blue } = data[i].color;
						cell.value = data[i].name;

						cell.backgroundColor = {
							red: getColor(red),
							green: getColor(green),
							blue: getColor(blue),
						};
					}

					if (j === 2) {
						cell.value = data[i].shipmentDate;
					}

					if (j === 6) {
						cell.value = data[i].postingNumber;
					}
				}
			}

			await sheet.saveUpdatedCells();

			return sheet.sheetId;
		} catch (err) {
			console.log(err);
		}
	}
}
