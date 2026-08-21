/**
 * Google Apps Script Web App that receives completed survey payloads via
 * POST and appends one row per rating to a Google Sheet.
 *
 * Setup:
 *   1. Create a new Google Sheet.
 *   2. Extensions > Apps Script, delete the default code, paste this file.
 *   3. Deploy > New deployment > type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the resulting Web App URL into this project's .env file as
 *      VITE_RESULTS_ENDPOINT=<url>
 *   5. Re-run `npm run build` (or restart `npm run dev`) so Vite picks up the env var.
 *
 * Each completed survey creates multiple rows (one per reference/method pair),
 * all sharing the same participant_id + completed_at so they can be grouped
 * back together during analysis.
 */

var SHEET_NAME = "Ratings";
var HEADER = [
  "participant_id",
  "completed_at",
  "reference_id",
  "method",
  "variant",
  "placeholder",
  "recognizability",
  "distinctive_exaggeration",
  "genuine_distinctiveness",
];

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
  }

  var payload = JSON.parse(e.postData.contents);
  var participantId = payload.participant_id || "";
  var completedAt = payload.completed_at || "";
  var ratings = payload.ratings || [];

  var rows = ratings.map(function (row) {
    return [
      participantId,
      completedAt,
      row.reference_id,
      row.method,
      row.variant,
      row.placeholder,
      row.recognizability,
      row.distinctive_exaggeration,
      row.genuine_distinctiveness,
    ];
  });

  if (rows.length > 0) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rows.length, HEADER.length)
      .setValues(rows);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "ok", rows: rows.length })).setMimeType(
    ContentService.MimeType.JSON
  );
}
