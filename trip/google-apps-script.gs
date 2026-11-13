// Family Trip Planner - shared storage.
// Paste this into Extensions > Apps Script of a new Google Sheet, then Deploy > New deployment > Web app,
// Execute as: Me, Who has access: Anyone. Copy the Web app URL and send it to Claude.

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Data');
  if (!sh) { sh = ss.insertSheet('Data'); sh.appendRow(['key', 'json', 'updated']); }
  return sh;
}

function doGet() {
  var rows = sheet_().getDataRange().getValues();
  var out = {};
  for (var i = 1; i < rows.length; i++) {
    try { out[rows[i][0]] = JSON.parse(rows[i][1]); } catch (e) {}
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = JSON.parse(e.postData.contents);
    var key = String(body.key || '');
    if (!/^(people|countries|settings)\/[a-z0-9-]{1,60}$/.test(key)) throw new Error('bad key');
    var json = JSON.stringify(body.value || {});
    if (json.length > 20000) throw new Error('too big');
    var sh = sheet_();
    var keys = sh.getRange(1, 1, sh.getLastRow(), 1).getValues();
    var row = -1;
    for (var i = 1; i < keys.length; i++) if (keys[i][0] === key) { row = i + 1; break; }
    if (row < 0) sh.appendRow([key, json, new Date()]);
    else sh.getRange(row, 2, 1, 2).setValues([[json, new Date()]]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
