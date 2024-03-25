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
const ROWS = 100;
const RANGE = `A1:G${ROWS}`;

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

			await sheet.clear(RANGE);
			await sheet.loadCells(RANGE);

			for (let i = 1; i < ROWS; i++) {
				for (let j = 0; j < COLUMNS; j++) {
					const cell = sheet.getCell(i, j);
					cell.clearAllFormatting();
				}
			}
			await sheet.saveUpdatedCells();

			sheet.setHeaderRow(["№", "Aртикли", "Цены", "", "", "", "Номер заказа"]);

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
							red: COLOR_MAX - red,
							green: COLOR_MAX - green,
							blue: COLOR_MAX - blue,
						};
					}

					if (j === 6) {
						cell.value = data[i].postingNumber;
					}
				}
			}

			await sheet.saveUpdatedCells();
		} catch (err) {
			console.log(err);
		}
	}
}
