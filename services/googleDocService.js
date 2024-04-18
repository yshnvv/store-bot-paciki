import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import {
	SHEET_ID,
	GOOGLE_SERVICE_ACCOUNT_EMAIL,
	GOOGLE_PRIVATE_KEY,
} from "../constants/environment.js";
import { getSheetDate } from "../utils/time.js";
import axios from "axios";

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

const DROPDOWN_VALUES = ["Ожидание ответа", "Подтверждён", "На базе", "Отмена"];

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

const batchUpdate = async (data) => {
	const response = await axios.post(
		`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`,
		data,
		{
			headers: {
				Authorization: `Bearer ${serviceAccountAuth.gtoken.accessToken}`,
				"Content-Type": "application/json",
			},
		}
	);

	return response;
};

const createDropdown = async (sheet, sheetId, count) => {
	const request = {
		requests: [
			{
				setDataValidation: {
					range: {
						sheetId: sheetId,
						startRowIndex: 1,
						endRowIndex: count + 1,
						startColumnIndex: 5,
						endColumnIndex: 6,
					},
					rule: {
						condition: {
							type: "ONE_OF_LIST",
							values: DROPDOWN_VALUES.map((value) => ({
								userEnteredValue: value,
							})),
						},
						strict: true,
					},
				},
			},
		],
	};

	try {
		await batchUpdate(request);

		for (let i = 1; i <= count; i++) {
			const cell = sheet.getCell(i, 5);

			if (!cell.value) {
				cell.value = DROPDOWN_VALUES[0];
			}
		}

		await sheet.saveUpdatedCells();
	} catch (err) {
		console.error(
			"Error creating dropdown:",
			err.response ? err.response.data.error : err.message
		);
	}
};

const autoResize = async (sheetId) => {
	const resizeRequest = {
		requests: [
			{
				autoResizeDimensions: {
					dimensions: {
						sheetId: sheetId,
						dimension: "COLUMNS",
						startIndex: 0,
						endIndex: 8,
					},
				},
			},
		],
	};

	try {
		await batchUpdate(resizeRequest);
	} catch (err) {
		console.error(
			"Error:",
			err.response ? err.response.data.error : err.message
		);
	}
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

			await sheet.loadCells(RANGE);

			prepareHeader(sheet);

			const rows = await sheet.getRows();
			const rowsToAdd = [];

			for (let i = 0; i < data.length; i++) {
				const newRow = {
					[NUMBER_COLUMN]: i + 1,
					[NAME_COLUMN]: data[i].name,
					[DATE_COLUMN]: data[i].shipmentDate,
					[POSTING_NUMBER_COLUMN]: data[i].postingNumber,
				};

				const index = rows.findIndex((row) => {
					const oldRow = row.toObject();

					return (
						newRow[NAME_COLUMN] === oldRow[NAME_COLUMN] &&
						newRow[POSTING_NUMBER_COLUMN] === oldRow[POSTING_NUMBER_COLUMN]
					);
				});

				if (index === -1) {
					rowsToAdd.push(newRow);
					const cell = sheet.getCell(i + 1, 1);

					const { red, green, blue } = data[i].color;

					cell.backgroundColor = {
						red: getColor(red),
						green: getColor(green),
						blue: getColor(blue),
					};
				}
			}

			await sheet.addRows(rowsToAdd);
			await sheet.saveUpdatedCells();
			await createDropdown(sheet, sheet.sheetId, data.length);
			await autoResize(sheet.sheetId);

			return sheet.sheetId;
		} catch (err) {
			console.log(err);
		}
	}
}
