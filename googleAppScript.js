// Google Apps Script Code - UPDATED VERSION
// 1. Create a new Google Sheet.
// 2. Go to Extensions > Apps Script.
// 3. Paste this code into Code.gs.
// 4. Click Deploy > New deployment > Select type: Web app.
// 5. Set "Execute as": "Me".
// 6. Set "Who has access": "Anyone".
// 7. Click Deploy and copy the "Web app URL".

const SHEET_NAME = "Participants";

function setup() {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = doc.insertSheet(SHEET_NAME);
    // Headers - Clean structure without backward compatibility
    sheet.appendRow([
      "id",
      "firstName", // 名
      "lastName", // 姓
      "email",
      "group",
      "bookIsbn",
      "bookTitle",
      "bookAuthors",
      "bookDescription",
      "wishlist",
      "assignedBookId",
      "assignedReason",
      "timestamp",
    ]);
  }
}

function doGet(e) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setup();
    sheet = doc.getSheetByName(SHEET_NAME);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);

  const participants = rows.map((row) => {
    let p = {};
    headers.forEach((header, index) => {
      if (header === "bookAuthors") {
        p[header] = row[index] ? row[index].toString().split(",") : [];
      } else {
        p[header] = row[index];
      }
    });
    return p;
  });

  return ContentService.createTextOutput(
    JSON.stringify(participants)
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const doc = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = doc.getSheetByName(SHEET_NAME);
  if (!sheet) {
    setup();
    sheet = doc.getSheetByName(SHEET_NAME);
  }

  try {
    const body = JSON.parse(e.postData.contents);

    // Handle delete action
    if (body.action === "delete") {
      const data = sheet.getDataRange().getValues();
      const ids = data.map((r) => r[0]); // ID is column 0
      const rowIndex = ids.indexOf(body.id);

      if (rowIndex > 0) {
        // Exclude header row
        sheet.deleteRow(rowIndex + 1);
        return ContentService.createTextOutput(
          JSON.stringify({ status: "success" })
        ).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(
          JSON.stringify({ status: "error", message: "Participant not found" })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Check if it's a bulk update (matching results) or single add/update
    if (Array.isArray(body)) {
      // Bulk update - update assigned info
      const data = sheet.getDataRange().getValues();
      const ids = data.map((r) => r[0]); // Assuming ID is column 0

      body.forEach((p) => {
        const rowIndex = ids.indexOf(p.id);
        if (rowIndex > 0) {
          // Exclude header
          // Update assigned info and group
          // Columns: 0:id, 1:firstName, 2:lastName, 3:email, 4:group,
          // 5:bookIsbn, 6:bookTitle, 7:bookAuthors, 8:bookDescription, 9:wishlist,
          // 10:assignedBookId, 11:assignedReason, 12:timestamp
          sheet.getRange(rowIndex + 1, 5).setValue(p.group || ""); // group column
          sheet.getRange(rowIndex + 1, 11).setValue(p.assignedBookId || ""); // assignedBookId column
          sheet.getRange(rowIndex + 1, 12).setValue(p.assignedReason || ""); // assignedReason column
        }
      });
    } else {
      // Single participant add or update
      const p = body;
      const data = sheet.getDataRange().getValues();
      const ids = data.map((r) => r[0]);
      const existingIndex = ids.indexOf(p.id);

      if (existingIndex > 0) {
        // Update existing participant
        const row = existingIndex + 1;
        sheet
          .getRange(row, 1, 1, 13)
          .setValues([
            [
              p.id,
              p.firstName || "",
              p.lastName || "",
              p.email || "",
              p.group || "",
              p.bookIsbn || "",
              p.bookTitle || "",
              Array.isArray(p.bookAuthors) ? p.bookAuthors.join(",") : "",
              p.bookDescription || "",
              p.wishlist || "",
              p.assignedBookId || "",
              p.assignedReason || "",
              new Date().toISOString(),
            ],
          ]);
      } else {
        // Add new participant
        sheet.appendRow([
          p.id,
          p.firstName || "",
          p.lastName || "",
          p.email || "",
          p.group || "",
          p.bookIsbn || "",
          p.bookTitle || "",
          Array.isArray(p.bookAuthors) ? p.bookAuthors.join(",") : "",
          p.bookDescription || "",
          p.wishlist || "",
          "", // assignedBookId
          "", // assignedReason
          new Date().toISOString(),
        ]);
      }
    }

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
