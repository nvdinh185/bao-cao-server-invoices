const db = require("./db/sqlite3/db-pool");
var Excel = require('exceljs');
var workbook = new Excel.Workbook();
var fs = require('fs');

const arrObj = require("./utils/array-object");
const vnHandler = require("./utils/vietnamese-handler");

const create_report_detail = async (bill_cycle) => {
    let results = await db.getRsts("select\
                                    d.name as staff_name,\
                                    c.staff_id,\
                                    e.name as price_name,\
                                    c.price_id,\
                                    c.count_customer,\
                                    c.sum_not_vat,\
                                    c.sum_vat,\
                                    c.sum_charge\
                                    from\
                                    (select\
                                    a.staff_id\
                                    ,a.price_id\
                                    , count(1) as count_customer\
                                    , sum(b.sum_not_vat) as sum_not_vat\
                                    , sum(b.sum_vat) as sum_vat\
                                    , sum(b.sum_charge) as sum_charge\
                                    from\
                                    customers a\
                                    , invoices  b\
                                    where a.id = b.customer_id\
                                    and b.bill_cycle='"+ bill_cycle + "'\
                                    group by a.staff_id, a.price_id) c,\
                                    staffs d,\
                                    prices e\
                                    where c.staff_id = d.id\
                                    and c.price_id = e.id\
                                    order by staff_id, price_id\
                                        ")
    //copy file template
    fs.createReadStream('./templates/VSMT.xlsx').pipe(fs.createWriteStream('./bao-cao/VSMT.xlsx'));
    //Nếu có dữ liệu thì mới đọc file mẫu và ghi
    if (results.length > 0) {
        //đọc file để ghi
        workbook.xlsx.readFile('./bao-cao/VSMT.xlsx')
            .then(() => {
                //xóa các sheet không liên quan đi
                workbook.removeWorksheet(workbook.getWorksheet(1).id)
                workbook.removeWorksheet(workbook.getWorksheet(2).id)
                var worksheet = workbook.getWorksheet(3);
                var row;
                var lastRow;
                var count_customer = 0;
                var sum_not_vat = 0;
                var sum_vat = 0;
                var sum_charge = 0;
                row = worksheet.getRow(2);
                row.getCell(3).value = "Tháng: " + arrObj.convertMonthYear(bill_cycle);

                //ghi dữ liệu mới vào
                results.forEach((element, idx) => {
                    row = worksheet.getRow(idx + 5);
                    row.getCell(1).value = idx + 1;
                    row.getCell(2).value = element.staff_name;
                    row.getCell(3).value = element.price_name;
                    row.getCell(4).value = element.count_customer;
                    row.getCell(5).value = element.sum_not_vat;
                    row.getCell(6).value = element.sum_vat;
                    row.getCell(7).value = element.sum_charge;
                    count_customer += element.count_customer;
                    sum_not_vat += element.sum_not_vat;
                    sum_vat += element.sum_vat;
                    sum_charge += element.sum_charge;
                    lastRow = idx + 5;
                    row.eachCell(cell => {
                        cell.border = {
                            top: { style: 'thin' },
                            bottom: { style: 'thin' },
                            left: { style: 'thin' },
                            right: { style: 'thin' },
                        };
                    });
                });
                row = worksheet.getRow(lastRow + 1);
                row.getCell(3).value = "Tổng cộng";
                row.getCell(4).value = count_customer;
                row.getCell(5).value = sum_not_vat;
                row.getCell(6).value = sum_vat;
                row.getCell(7).value = sum_charge;
                row = worksheet.getRow(lastRow + 2);
                row.getCell(3).value = "Bằng chữ:";
                row.getCell(4).value = vnHandler.StringVietnamDong(sum_charge);
                return workbook.xlsx.writeFile('./bao-cao/VSMT.xlsx');
            })
            .catch(err => console.log("xay ra loi: ", err))
    } else {
        console.log('Không có chi để ghi!');
    }
}

create_report_detail("201901")