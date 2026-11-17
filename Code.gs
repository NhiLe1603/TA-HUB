/*************************************************************
 * ATINO TA HUB — BACKEND (Google Apps Script)
 * Lưu dữ liệu app vào Google Sheet qua 1 Web App URL.
 *
 * CÁCH DÙNG (1 lần):
 *  1. Tạo 1 Google Sheet MỚI (vd "ATINO TA Hub - Data") — nên tách riêng
 *     với Sheet sơ vấn cũ cho gọn.
 *  2. Extensions → Apps Script → xoá hết → dán TOÀN BỘ file này → Save.
 *  3. (tuỳ chọn) chạy hàm setup() 1 lần để tạo sẵn 2 tab.
 *  4. Deploy → New deployment → Web app · Execute as: Me · Who has access: Anyone
 *     → Deploy → copy URL (kết thúc /exec). Dán URL đó vào hằng API_URL của app.
 *  5. Khi SỬA code sau này: Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy.
 *
 * HỢP ĐỒNG API (cho app gọi):
 *  ĐỌC  (GET,  ?action=...):
 *    - ping                         → {ok,time}
 *    - all                          → {ok, positions:[...], candidates:[...]}   (dùng khi mở app)
 *    - listPositions                → {ok, data:[...]}
 *    - listCandidates[&posId&trangThai&ta] → {ok, data:[...]}  (lọc tuỳ chọn)
 *    - getPosition&posId=...        → {ok, data:{...}}
 *    - getCandidate&candId=...      → {ok, data:{...}}
 *  GHI  (POST, body = JSON {action, ...}, Content-Type: text/plain):
 *    - savePosition   {position:{...}}     (upsert theo posId; không có posId → tự sinh)
 *    - saveCandidate  {candidate:{...}}    (upsert theo candId; MERGE: chỉ cập nhật field gửi lên)
 *    - updateStage    {candId, trangThai}
 *    - deleteCandidate{candId}  /  deletePosition{posId}
 *
 * GỢI Ý CHO APP (để tránh lỗi CORS khi đọc response POST):
 *  - ĐỌC bằng GET (đọc được JSON bình thường).
 *  - GHI bằng POST, Content-Type: 'text/plain;charset=utf-8' (simple request, không bị preflight).
 *  - App nên TỰ SINH id phía client (vd 'C'+Date.now()) và gửi kèm → không phụ thuộc đọc response.
 *  - Sau khi ghi xong, gọi lại GET (all/list...) để refresh dữ liệu.
 *************************************************************/

var POS   = 'Positions';
var CAND  = 'Candidates';

var POS_H  = ['posId','tenViTri','nhom','chanDung','scorecard','jd','nguon','nguoiCapNhat','ngayCapNhat'];
var POS_J  = ['chanDung','scorecard','nguon'];                       // cột lưu dạng JSON

var CAND_H = ['candId','hoTen','maHoSo','posId','nguon','taPhuTrach','trangThai',
              'diemCV','ketLuanCV','diemSoVan','ketLuanSoVan','ghiChu','chiTiet','ngayTao','ngayCapNhat'];
var CAND_J = ['chiTiet'];

/* ----------------------- ĐỌC (GET) ----------------------- */
function doGet(e){
  try{
    var p = (e && e.parameter) || {};
    var action = p.action || 'ping';
    if(action==='ping')          return json_({ok:true, time:new Date()});
    if(action==='all')           return json_({ok:true,
                                      positions: readAll_(POS,  POS_H,  POS_J),
                                      candidates: readAll_(CAND, CAND_H, CAND_J)});
    if(action==='listPositions') return json_({ok:true, data: readAll_(POS, POS_H, POS_J)});
    if(action==='listCandidates'){
      var list = readAll_(CAND, CAND_H, CAND_J);
      if(p.posId)     list = list.filter(function(c){return String(c.posId)===String(p.posId);});
      if(p.trangThai) list = list.filter(function(c){return String(c.trangThai)===String(p.trangThai);});
      if(p.ta)        list = list.filter(function(c){return String(c.taPhuTrach)===String(p.ta);});
      return json_({ok:true, data:list});
    }
    if(action==='getPosition')   return json_({ok:true, data: getById_(POS,  POS_H,  POS_J,  'posId',  p.posId)});
    if(action==='getCandidate')  return json_({ok:true, data: getById_(CAND, CAND_H, CAND_J, 'candId', p.candId)});
    return json_({ok:false, error:'Unknown GET action: '+action});
  }catch(err){ return json_({ok:false, error:String(err)}); }
}

/* ----------------------- GHI (POST) ---------------------- */
function doPost(e){
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    var body = {};
    if(e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    var action = body.action;
    if(action==='savePosition')
      return json_({ok:true, data: upsert_(POS, POS_H, POS_J, 'posId', body.position || {}, 'P')});
    if(action==='saveCandidate')
      return json_({ok:true, data: upsert_(CAND, CAND_H, CAND_J, 'candId', body.candidate || {}, 'C')});
    if(action==='updateStage')
      return json_({ok:true, data: upsert_(CAND, CAND_H, CAND_J, 'candId',
                      {candId:body.candId, trangThai:body.trangThai}, 'C')});
    if(action==='deleteCandidate')
      return json_({ok: deleteById_(CAND, CAND_H, 'candId', body.candId)});
    if(action==='deletePosition')
      return json_({ok: deleteById_(POS, POS_H, 'posId', body.posId)});
    return json_({ok:false, error:'Unknown POST action: '+action});
  }catch(err){
    return json_({ok:false, error:String(err)});
  }finally{
    lock.releaseLock();
  }
}

/* ----------------------- HELPERS ------------------------- */
function json_(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_(name, headers){
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if(!sh){ sh = ss.insertSheet(name); sh.appendRow(headers); }
  else if(sh.getLastRow()===0){ sh.appendRow(headers); }
  return sh;
}

function parseJson_(v){
  if(v==='' || v===null || v===undefined) return null;
  if(typeof v === 'object') return v;
  try{ return JSON.parse(v); }catch(e){ return v; }  // không phải JSON thì trả nguyên văn
}

function readAll_(name, headers, jsonCols){
  var sh = getSheet_(name, headers);
  var lastRow = sh.getLastRow();
  if(lastRow < 2) return [];
  var rows = sh.getRange(2, 1, lastRow-1, headers.length).getValues();
  return rows.map(function(row){
    var o = {};
    headers.forEach(function(h,i){ o[h] = row[i]; });
    jsonCols.forEach(function(c){ o[c] = parseJson_(o[c]); });
    return o;
  });
}

function findRow_(sh, idColIndex, idVal){
  var lastRow = sh.getLastRow();
  if(lastRow < 2) return -1;
  var ids = sh.getRange(2, idColIndex, lastRow-1, 1).getValues();
  for(var i=0;i<ids.length;i++){
    if(String(ids[i][0]) === String(idVal)) return i + 2; // số dòng thật trong sheet
  }
  return -1;
}

function getById_(name, headers, jsonCols, idKey, idVal){
  if(!idVal) return null;
  var all = readAll_(name, headers, jsonCols);
  for(var i=0;i<all.length;i++){ if(String(all[i][idKey])===String(idVal)) return all[i]; }
  return null;
}

/* upsert MERGE: có id & tìm thấy → cập nhật (chỉ field gửi lên); không → thêm mới.
   Tự quản ngayTao (khi mới) & ngayCapNhat (luôn). */
function upsert_(name, headers, jsonCols, idKey, incoming, idPrefix){
  var sh = getSheet_(name, headers);
  var idColIndex = headers.indexOf(idKey) + 1;
  if(!incoming[idKey]) incoming[idKey] = idPrefix + Date.now() + Math.floor(Math.random()*1000);
  var rowNum = findRow_(sh, idColIndex, incoming[idKey]);

  var existing = {};
  if(rowNum > 0){
    var vals = sh.getRange(rowNum, 1, 1, headers.length).getValues()[0];
    headers.forEach(function(h,i){ existing[h] = vals[i]; });
    jsonCols.forEach(function(c){ existing[c] = parseJson_(existing[c]); });
  }

  var merged = {};
  headers.forEach(function(h){
    merged[h] = (incoming[h] !== undefined) ? incoming[h]
              : (existing[h] !== undefined ? existing[h] : '');
  });

  var now = new Date();
  if(headers.indexOf('ngayCapNhat') >= 0) merged['ngayCapNhat'] = now;
  if(headers.indexOf('ngayTao') >= 0 && rowNum < 0 && !merged['ngayTao']) merged['ngayTao'] = now;

  var rowValues = headers.map(function(h){
    var v = merged[h];
    if(jsonCols.indexOf(h) >= 0 && v && typeof v === 'object') return JSON.stringify(v);
    return (v === undefined || v === null) ? '' : v;
  });

  if(rowNum > 0) sh.getRange(rowNum, 1, 1, headers.length).setValues([rowValues]);
  else           sh.appendRow(rowValues);

  return merged;
}

function deleteById_(name, headers, idKey, idVal){
  if(!idVal) return false;
  var sh = getSheet_(name, headers);
  var row = findRow_(sh, headers.indexOf(idKey)+1, idVal);
  if(row > 0){ sh.deleteRow(row); return true; }
  return false;
}

/* Chạy 1 lần (tuỳ chọn) để tạo sẵn 2 tab + header */
function setup(){
  getSheet_(POS,  POS_H);
  getSheet_(CAND, CAND_H);
}
