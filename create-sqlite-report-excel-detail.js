const db = require("./db/sqlite3/db-pool");
var Excel = require('exceljs');
var workbook = new Excel.Workbook();

const arrObj = require("./utils/array-object");
const vnHandler = require("./utils/vietnamese-handler");

const create_report_detail = async (bill_cycle, staff_id) => {
    let results = await db.getRsts("select\
            a.cust_id\
            ,a.full_name\
            ,a.address\
            ,b.sum_not_vat\
            ,b.sum_vat\
            ,b.sum_charge\
            from\
            customers a\
            ,invoices  b\
            where b.bill_cycle = '"+ bill_cycle + "'\
            and a.staff_id='"+ staff_id + "'\
            and a.id = b.customer_id\
            ")
    let staff_name = await db.getRst("select name from staffs where id = " + staff_id)
    //Nếu có dữ liệu thì mới đọc file mẫu và ghi
    if (results.length > 0) {
        //đọc file mẫu
        workbook.xlsx.readFile('./templates/VSMT.xlsx')
            .then(() => {
                //xóa 2 sheet không cần thiết đi
                workbook.removeWorksheet(workbook.getWorksheet(2).id)
                workbook.removeWorksheet(workbook.getWorksheet(3).id)
                //lấy sheet để ghi
                var worksheet = workbook.getWorksheet(1);
                var row;
                var lastRow;
                var sum_not_vat = 0;
                var sum_vat = 0;
                var sum_charge = 0;
                row = worksheet.getRow(2);
                row.getCell(3).value = "Người Quản Lý: " + staff_name.name;
                row = worksheet.getRow(3);
                row.getCell(3).value = "Tháng: " + arrObj.convertMonthYear(bill_cycle);

                //ghi dữ liệu mới vào
                results.forEach((element, idx) => {
                    lastRow = idx + 6;
                    sum_not_vat += element.sum_not_vat
                    sum_vat += element.sum_vat
                    sum_charge += element.sum_charge
                    row = worksheet.getRow(idx + 6);
                    row.getCell(1).value = idx + 1;
                    row.getCell(2).value = element.cust_id;
                    row.getCell(3).value = element.full_name;
                    row.getCell(4).value = element.address;
                    row.getCell(5).value = element.sum_not_vat;
                    row.getCell(6).value = element.sum_vat;
                    row.getCell(7).value = element.sum_charge;
                    row.eachCell((cell) => {
                        cell.border = {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                            left: { style: 'thin' },
                            right: { style: 'thin' },
                        };
                    });
                });
                //ghi tổng hợp
                row = worksheet.getRow(lastRow + 2);
                row.getCell(4).value = "Tổng tiền chưa thuế:"
                row.getCell(5).value = sum_not_vat
                row = worksheet.getRow(lastRow + 3);
                row.getCell(4).value = "Tổng tiền thuế:"
                row.getCell(5).value = sum_vat
                row = worksheet.getRow(lastRow + 4);
                row.getCell(4).value = "Tổng tiền:"
                row.getCell(5).value = sum_charge
                row = worksheet.getRow(lastRow + 5);
                row.getCell(4).value = "Bằng chữ:"
                row.getCell(5).value = vnHandler.StringVietnamDong(sum_charge)
                //ghi file kết quả
                return workbook.xlsx.writeFile('./bao-cao/VSMT2.xlsx');
            })
            .catch(err => console.log("xay ra loi: ", err))
    } else {
        console.log("Không có chi để ghi hết!")
    }
}

create_report_detail("201904", "1")