import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config();

const { SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } =
	process.env;

const serviceAccountAuth = new JWT({
	email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: GOOGLE_PRIVATE_KEY,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export class GoogleDocService {
	static async updateSheet(data) {
		try {
			const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
			await doc.loadInfo();

			const sheet = doc.sheetsByIndex[0];
			await sheet.clearRows();

			await sheet.addRows(data);
		} catch (err) {
			console.log(err);
		}
	}
}
