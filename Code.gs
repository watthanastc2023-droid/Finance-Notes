function doGet() {
  return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Finance Tracker System')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- 1. LOGIN SYSTEM ---
function loginUser(username, password) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  
  if (!sheet) return { success: false, msg: "ບໍ່ພົບ Sheet 'Users'" };
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(username) && String(data[i][1]) === String(password)) {
      return { success: true, fullname: data[i][2], username: data[i][0] };
    }
  }
  return { success: false };
}

// --- 2. DATA HANDLING (Dropdowns & Settings) ---
function getAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var getList = function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    return sheet ? sheet.getDataRange().getValues().slice(1).flat().filter(String) : [];
  };

  return {
    income: getList('Settings_Income'),
    expense: getList('Settings_Expense'),
    banks: getList('Settings_Bank')
  };
}

// --- 3. ADD TRANSACTION ---
function addTransaction(formObject, userFullname) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Transactions');
  if (!sheet) return "Error: Missing Transactions Sheet";

  var timestamp = new Date();
  var id = new Date().getTime(); // Unique ID
  
  // Logic: Bank is saved only if it is Income AND Transfer
  var bankAcc = (formObject.type === 'Income' && formObject.method === 'Transfer') ? formObject.bankAccount : '';
  
  // แปลง string date เป็น Date object เพื่อให้ Google Sheets เก็บเป็นวันที่จริง
  var transactionDate = new Date(formObject.date);
  
  sheet.appendRow([
    "'"+id, // Force string for ID
    transactionDate, // บันทึกเป็น Date object แทน string
    formObject.type,
    formObject.category,
    Number(formObject.amount), // แปลงเป็นตัวเลข
    formObject.desc,
    formObject.method,
    bankAcc,
    userFullname,
    timestamp
  ]);
  return "Success";
}

// --- 4. DASHBOARD REPORT (FIXED & SAFER) ---
function getDashboardData(startDate, endDate) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Transactions');
    
    // ກັນພາດ: ຖ້າບໍ່ພົບ Sheet
    if (!sheet) return { totalIncome: 0, totalExpense: 0, transactions: [] };
    
    // ກັນພາດ: ຖ້າບໍ່ມີຂໍ້ມູນ (ມີແຕ່ Header)
    if (sheet.getLastRow() < 2) return { totalIncome: 0, totalExpense: 0, transactions: [] };

    var data = sheet.getDataRange().getValues();
    data.shift(); // ລຶບ Header

    var tz = ss.getSpreadsheetTimeZone(); 
    
    // ແປງ Filter ໃຫ້ເປັນ Date Object ເພື່ອປຽບທຽບ
    var startObj = new Date(startDate);
    startObj.setHours(0, 0, 0, 0);
    
    var endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    var filtered = data.filter(function(row) {
      var rowDateValue = row[1]; 
      if (!rowDateValue) return false;

      try {
        var rDate = new Date(rowDateValue);
        // ກວດສອບວັນທີ
        return rDate.getTime() >= startObj.getTime() && rDate.getTime() <= endObj.getTime();
      } catch (e) {
        return false;
      }
    });

    var summary = { totalIncome: 0, totalExpense: 0, transactions: [] };

    // Sort ໃໝ່ -> ເກົ່າ
    filtered.sort(function(a, b) {
      return new Date(b[1]) - new Date(a[1]);
    });

    filtered.forEach(function(row) {
      var amount = Number(row[4]); 
      if (isNaN(amount)) amount = 0;
      var type = String(row[2]).trim();

      if (type === 'Income') summary.totalIncome += amount;
      if (type === 'Expense') summary.totalExpense += amount;
      
      // *** ຈຸດສຳຄັນທີ່ແກ້ໄຂ: ແປງວັນທີເປັນ String ກ່ອນສົ່ງກັບ Client ***
      // ການສົ່ງ Date Object ໂດຍກົງມັກຈະເກີດບັນຫາ null ເວລາສົ່ງຜ່ານ google.script.run
      var dateString = "";
      try {
        dateString = Utilities.formatDate(new Date(row[1]), tz, "yyyy-MM-dd");
      } catch(e) {
        dateString = startDate; // Fallback
      }

      summary.transactions.push({
        date: dateString, // ສົ່ງເປັນ Text ແທນ Date Object
        type: type,
        category: row[3],
        amount: amount,
        desc: row[5] || '',
        bank: row[7] || ''
      });
    });

    return summary; // ຕ້ອງ Return Object ສະເໝີ
  
  } catch (error) {
    // ຖ້າ Error ໃຫ້ Return Object ວ່າງໆ ພ້ອມແຈ້ງ Error ໃນ Log
    Logger.log("SERVER ERROR: " + error);
    return { totalIncome: 0, totalExpense: 0, transactions: [] };
  }
}

// --- 5. SETTINGS MANAGER (Add/Delete) ---
function addSettingItem(type, value) {
  var sheetName = '';
  if (type === 'income') sheetName = 'Settings_Income';
  else if (type === 'expense') sheetName = 'Settings_Expense';
  else if (type === 'bank') sheetName = 'Settings_Bank';
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if(sheet) sheet.appendRow([value]);
  
  return getAllData(); // Return updated list
}

function deleteSettingItem(type, value) {
  var sheetName = '';
  if (type === 'income') sheetName = 'Settings_Income';
  else if (type === 'expense') sheetName = 'Settings_Expense';
  else if (type === 'bank') sheetName = 'Settings_Bank';
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == value) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return getAllData();
}
