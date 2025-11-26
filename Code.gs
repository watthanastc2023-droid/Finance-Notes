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
    // ປຽບທຽບແບບ String ເພື່ອກັນພາດ
    if (String(data[i][0]) === String(username) && String(data[i][1]) === String(password)) {
      return { success: true, fullname: data[i][2], username: data[i][0] };
    }
  }
  return { success: false };
}

// --- 2. DATA HANDLING ---
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
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Transactions');
    if (!sheet) return "Error: Missing Transactions Sheet";

    var timestamp = new Date();
    var id = new Date().getTime(); 
    
    // **ແກ້ໄຂຂໍ້ 4:** ຖ້າເປັນ Transfer ໃຫ້ບັນທຶກ Bank ໄດ້ເລີຍ (ບໍ່ຈຳກັດວ່າຕ້ອງເປັນ Income)
    var bankAcc = (formObject.method === 'Transfer') ? formObject.bankAccount : '';
    
    // ແປງຂໍ້ມູນກ່ອນບັນທຶກ
    var transactionDate = new Date(formObject.date);
    // **ແກ້ໄຂຂໍ້ 5:** ຕັດເຄື່ອງໝາຍຈຸດ (,) ອອກຈາກຈຳນວນເງິນກ່ອນບັນທຶກ
    var amountClean = String(formObject.amount).replace(/,/g, ""); 

    sheet.appendRow([
      "'"+id,
      transactionDate, 
      formObject.type,
      formObject.category,
      Number(amountClean), // ບັນທຶກເປັນຕົວເລກ
      formObject.desc,
      formObject.method,
      bankAcc,
      userFullname,
      timestamp
    ]);
    return "Success";
  } catch(e) {
    return "Error: " + e.toString();
  }
}

// --- 4. DASHBOARD & REPORT DATA ---
function getDashboardData(startDate, endDate) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Transactions');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { totalIncome: 0, totalExpense: 0, transactions: [] };
    }

    var data = sheet.getDataRange().getValues();
    data.shift(); // Remove Header

    var tz = ss.getSpreadsheetTimeZone(); 
    
    // ຕັ້ງຄ່າວັນທີສຳລັບປຽບທຽບ
    var startObj = new Date(startDate); startObj.setHours(0,0,0,0);
    var endObj = new Date(endDate); endObj.setHours(23,59,59,999);

    var filtered = data.filter(function(row) {
      if (!row[1]) return false;
      try {
        var rDate = new Date(row[1]);
        return rDate.getTime() >= startObj.getTime() && rDate.getTime() <= endObj.getTime();
      } catch (e) { return false; }
    });

    var summary = { totalIncome: 0, totalExpense: 0, transactions: [] };

    // Sort Newest -> Oldest
    filtered.sort(function(a, b) { return new Date(b[1]) - new Date(a[1]); });

    filtered.forEach(function(row) {
      var amount = Number(row[4]); 
      if (isNaN(amount)) amount = 0;
      var type = String(row[2]).trim();

      if (type === 'Income') summary.totalIncome += amount;
      if (type === 'Expense') summary.totalExpense += amount;
      
      // ແປງວັນທີເປັນ String ສົ່ງກັບໄປ (ປ້ອງກັນ Error)
      var dateStr = Utilities.formatDate(new Date(row[1]), tz, "yyyy-MM-dd");

      summary.transactions.push({
        date: dateStr, 
        type: type,
        category: row[3],
        amount: amount,
        desc: row[5] || '',
        bank: row[7] || ''
      });
    });

    return summary;
  
  } catch (error) {
    Logger.log("SERVER ERROR: " + error);
    return { totalIncome: 0, totalExpense: 0, transactions: [] };
  }
}

// --- 5. SETTINGS MANAGER ---
function addSettingItem(type, value) {
  var sheetName = '';
  if (type === 'income') sheetName = 'Settings_Income';
  else if (type === 'expense') sheetName = 'Settings_Expense';
  else if (type === 'bank') sheetName = 'Settings_Bank';
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if(sheet) sheet.appendRow([value]);
  return getAllData();
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
