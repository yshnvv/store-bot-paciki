import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import {
	SHEET_ID,
	GOOGLE_SERVICE_ACCOUNT_EMAIL,
	GOOGLE_PRIVATE_KEY,
} from "../constants/environment.js";

const serviceAccountAuth = new JWT({
	email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: GOOGLE_PRIVATE_KEY,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const CELL_COUNT = 100;
const CELL_RANGE = `A1:A${CELL_COUNT}`;

export class GoogleDocService {
	static async updateSheet(data) {
		try {
			const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
			await doc.loadInfo();

			const sheet = doc.sheetsByIndex[0];
			await sheet.clear(CELL_RANGE);
			await sheet.loadCells(CELL_RANGE);

			for (let i = 1; i < CELL_COUNT; i++) {
				const cell = sheet.getCell(i, 0);
				cell.backgroundColor = { red: 1, green: 1, blue: 1 };
			}
			await sheet.saveUpdatedCells();

			sheet.setHeaderRow(["Aртикли", "Цены"]);

			data.forEach((article, index) => {
				const cell = sheet.getCell(index + 1, 0);
				cell.value = article.name;
				cell.backgroundColor = article.color;
			});

			await sheet.saveUpdatedCells();
		} catch (err) {
			console.log(err);
		}
	}
}
