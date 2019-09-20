const db = require("./db/sqlite3/db-pool");
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var fs = require('fs');

const arrObj = require("./utils/array-object");
const vnHandler = require("./utils/vietnamese-handler");

const create_report_detail = async (bill_cycle) => {
    //copy file template
    fs.createReadStream('./templates/VSMT.xlsx').pipe(fs.createWriteStream('./bao-cao/VSMT.xlsx'));
    //lấy danh sách staff từ DB
    let staff = await db.getRsts("select * from staffs")
    //Với mỗi staff in một sheet trong cùng 1 bảng excel
    for (let i = 0; i < staff.length; i++) {
        //chọn dữ liệu theo mỗi staff
        let results = await db.getRsts("select\
                                        a.cust_id\
                                        ,a.full_name\
                                        ,a.address\
                                        ,b.sum_not_vat\
                                        ,b.sum_vat\
                                        ,b.sum_charge\
                                        from\
                                        customers a\
                                        ,invoices b\
                                        where b.bill_cycle = '"+ bill_cycle + "'\
                                        and a.staff_id='"+ staff[i].id + "'\
                                        and a.id = b.customer_id\
                                        ")
        //Nếu có dữ liệu thì mới đọc file mẫu và ghi
        if (results.length > 0) {
            //ghi dữ liệu vào mỗi sheet excel
            await workbook.xlsx.readFile('./bao-cao/VSMT.xlsx')
                .then(() => {
                    //copy sheet mẫu ra để ghi thông tin của mỗi nhân viên
                    let sheetToClone = workbook.getWorksheet("templates")
                    let copySheet = workbook.addWorksheet()
                    copySheet.model = sheetToClone.model
                    copySheet.name = staff[i].name
                    copySheet.mergeCells('A1:B1');
                    copySheet.mergeCells('C1:G1');
                    copySheet.mergeCells('C2:G2');
                    copySheet.mergeCells('C3:G3');
                    worksheet = workbook.getWorksheet(staff[i].name);
                    //sau khi xong thì xóa các sheet mẫu đi
                    if (i == staff.length - 1) {
                        workbook.removeWorksheet(workbook.getWorksheet("templates").id)
                        workbook.removeWorksheet(workbook.getWorksheet(2).id)
                        workbook.removeWorksheet(workbook.getWorksheet(3).id)
                    }
                    var row;
                    var lastRow;
                    var sum_not_vat = 0;
                    var sum_vat = 0;
                    var sum_charge = 0;
                    row = worksheet.getRow(2);
                    row.getCell(3).value = "Người Quản Lý: " + staff[i].name;
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
                    //ghi tổng kết
                    row = worksheet.getRow(lastRow + 1);
                    row.getCell(4).value = "Tổng tiền chưa thuế:"
                    row.getCell(5).value = sum_not_vat
                    row = worksheet.getRow(lastRow + 2);
                    row.getCell(4).value = "Tổng tiền thuế:"
                    row.getCell(5).value = sum_vat
                    row = worksheet.getRow(lastRow + 3);
                    row.getCell(4).value = "Tổng tiền:"
                    row.getCell(5).value = sum_charge
                    row = worksheet.getRow(lastRow + 4);
                    row.getCell(4).value = "Bằng chữ:"
                    row.getCell(5).value = vnHandler.StringVietnamDong(sum_charge)
                    return workbook.xlsx.writeFile('./bao-cao/VSMT.xlsx');
                })
                .catch(err => console.log("xay ra loi: ", err))
        }
    }
}

create_report_detail("201901")