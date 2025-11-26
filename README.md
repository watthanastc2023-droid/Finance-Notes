ຂັ້ນຕອນທີ 1: ກຽມຖານຂໍ້ມູນ (Google Sheet)
ທ່ານຕ້ອງສ້າງ Google Sheet ໃໝ່ ແລະ ສ້າງ 4 Sheet (Tabs) ດັ່ງນີ້:

ຊື່ Sheet: Transactions (ເກັບຂໍ້ມູນການຮັບ-ຈ່າຍ)
Row 1 (Header): ID, Date, Type (Income/Expense), Category, Amount, Description, PaymentMethod, BankAccount, User, Timestamp

ຊື່ Sheet: Users (ເກັບຂໍ້ມູນຜູ້ໃຊ້)
Row 1: Username, Password, Fullname
ຂໍ້ມູນຕົວຢ່າງ: admin, 1234, Admin User

ຊື່ Sheet: Settings_Income (ໝວດໝູ່ລາຍຮັບ)
Row 1: CategoryName

ຊື່ Sheet: Settings_Expense (ໝວດໝູ່ລາຍຈ່າຍ)
Row 1: CategoryName

ຊື່ Sheet: Settings_Bank (ບັນຊີທະນາຄານ)
Row 1: BankName

ຂັ້ນຕອນທີ 2: Google Apps Script (Code.gs)
ໄປທີ່ Extensions > Apps Script ແລະ ວາງ code ລົງໄປ

ຂັ້ນຕອນທີ 3: ສ່ວນໜ້າເວັບ (Index.html)
ສ້າງໄຟລ໌ HTML ຊື່ Index ແລະ ໃສ່ code. ມັນລວມເອົາ CSS (Bootstrap), HTML, ແລະ JavaScript ໄວ້ບ່ອນດຽວເພື່ອຄວາມງ່າຍໃນການ Copy.
