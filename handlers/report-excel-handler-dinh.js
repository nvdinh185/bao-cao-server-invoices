const db = require("./../db/sqlite3/db-pool");
var Excel = require('exceljs');
const fs = require('fs');
var workbook = new Excel.Workbook();

const arrObj = require("./../utils/array-object");
const vnHandler = require("./../utils/vietnamese-handler");

/**
 * Tạo báo cáo chi tiết theo nhân viên, quý
 * @param {*} results 
 * @param {*} bill_cycle 
 * @param {*} staff_name 
 * @param {*} outputFilename 
 */
const create_report_detail = (results, bill_cycle, staff_name, outputFilename) => {
    return new Promise((resolve, reject) => {
        workbook.xlsx.readFile(outputFilename)
            .then(async () => {
                //xóa 2 sheet không cần thiết
                workbook.removeWorksheet(workbook.getWorksheet(2).id)
                workbook.removeWorksheet(workbook.getWorksheet(3).id)
                var worksheet = workbook.getWorksheet(1);
                var row;
                var lastRow;
                var sum_not_vat = 0;
                var sum_vat = 0;
                var sum_charge = 0;
                row = worksheet.getRow(2);
                row.getCell(3).value = "Người Quản Lý: " + staff_name;
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
                await workbook.xlsx.writeFile(outputFilename);
                resolve()
            })
            .catch(err => {
                reject(err);
            })
    })
}

/**
 * Tạo báo cáo chi tiết theo nhân viên, mỗi nhân viên một sheet
 * @param {*} bill_cycle 
 * @param {*} outputFilename 
 */
const create_report_staff_detail = (bill_cycle, outputFilename) => {
    return new Promise(async (resolve, reject) => {
        //lấy danh sách staff từ DB
        staff = await db.getRsts("select * from staffs")
        let index = 0
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
            ,invoices  b\
            where b.bill_cycle = '"+ bill_cycle + "'\
            and a.staff_id='"+ staff[i].id + "'\
            and a.id = b.customer_id\
            ")
            //nếu có kết quả select thì mới ghi dữ liệu vào
            if (results.length > 0) {
                index++;
                //ghi dữ liệu vào mỗi sheet excel
                await workbook.xlsx.readFile(outputFilename)
                    .then(() => {
                        //nếu có kết quả select thì mới ghi dữ liệu vào
                        if (results.length > 0) {
                            //copy sheet mẫu ra để ghi thông tin mỗi nhân viên
                            let sheetToClone = workbook.getWorksheet("templates")
                            let copySheet = workbook.addWorksheet()
                            copySheet.model = sheetToClone.model
                            copySheet.name = staff[i].name
                            copySheet.mergeCells('A1:B1');
                            copySheet.mergeCells('C1:G1');
                            copySheet.mergeCells('C2:G2');
                            copySheet.mergeCells('C3:G3');
                            worksheet = workbook.getWorksheet(staff[i].name);
                            //sau khi xong thì xóa sheet mẫu đi
                            if (i == staff.length - 1) {
                                workbook.removeWorksheet(workbook.getWorksheet("templates").id)
                                //workbook.removeWorksheet(workbook.getWorksheet(2).id)
                                //workbook.removeWorksheet(workbook.getWorksheet(3).id)
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
                            return workbook.xlsx.writeFile(outputFilename);
                        }
                    })
                    .catch(err => reject(err))
            }
        }
        //Nếu ghi thành công 1 sheet nào đó thì trả về resolve để đọc file trả về client
        if (index > 0) {
            resolve()
        } else {
            //nếu không ghi được sheet nào thì xóa sheet mẫu đi
            workbook.xlsx.readFile(outputFilename)
                .then(async () => {
                    workbook.removeWorksheet(workbook.getWorksheet(1).id)
                    await workbook.xlsx.writeFile(outputFilename);
                    resolve()
                })
                .catch(err => {
                    reject(err);
                })
        }
    })
}

/**
 * Tạo báo cáo tổng hợp theo vùng
 * @param {*} results 
 * @param {*} bill_cycle 
 * @param {*} outputFilename 
 */
const create_report_area = (results, bill_cycle, outputFilename) => {
    return new Promise((resolve, reject) => {
        if (results.length > 0) {
            workbook.xlsx.readFile(outputFilename)
                .then(async () => {
                    //workbook.removeWorksheet(workbook.getWorksheet(1).id)
                    //workbook.removeWorksheet(workbook.getWorksheet(3).id)
                    var worksheet = workbook.getWorksheet(2);
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
                        row.getCell(2).value = element.area_name;
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
                    //ghi báo cáo
                    row = worksheet.getRow(lastRow + 2);
                    row.getCell(3).value = "Tổng cộng:";
                    row.getCell(4).value = count_customer;
                    row.getCell(5).value = sum_not_vat;
                    row.getCell(6).value = sum_vat;
                    row.getCell(7).value = sum_charge;
                    row = worksheet.getRow(lastRow + 3);
                    row.getCell(3).value = "Bằng chữ";
                    row.getCell(4).value = vnHandler.StringVietnamDong(sum_charge);
                    await workbook.xlsx.writeFile(outputFilename);
                    resolve()
                })
                .catch(err => {
                    reject(err);
                })
        } else {
            //nếu không ghi được thì xóa sheet mẫu đi
            workbook.xlsx.readFile(outputFilename)
                .then(async () => {
                    workbook.removeWorksheet(workbook.getWorksheet(2).id)
                    await workbook.xlsx.writeFile(outputFilename);
                    resolve()
                })
                .catch(err => {
                    reject(err);
                })
        }
    })
}

/**
 * Tạo báo cáo tổng hợp theo nhân viên
 * @param {*} results 
 * @param {*} bill_cycle 
 * @param {*} outputFilename 
 */
const create_report_staff = (results, bill_cycle, outputFilename) => {
    return new Promise((resolve, reject) => {
        if (results.length > 0) {
            workbook.xlsx.readFile(outputFilename)
                .then(async () => {
                    //workbook.removeWorksheet(workbook.getWorksheet(1).id)
                    //workbook.removeWorksheet(workbook.getWorksheet(2).id)
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
                    await workbook.xlsx.writeFile(outputFilename);
                    resolve()
                })
                .catch(err => {
                    reject(err);
                })
        } else {
            //nếu không ghi được thì xóa sheet mẫu đi
            workbook.xlsx.readFile(outputFilename)
                .then(async () => {
                    workbook.removeWorksheet(workbook.getWorksheet(3).id)
                    await workbook.xlsx.writeFile(outputFilename);
                    resolve()
                })
                .catch(err => {
                    reject(err);
                })
        }
    })
}

class ReportExcelHandler {

    /**
     * Lấy báo cáo chi tiết theo nhân viên
     * @param {*} req 
     * @param {*} res 
     * Tham số vào req.paramS.bill_cycle, req.paramS.staff_id
     * 
     */
    getReportDetail(req, res) {
        db.getRsts("select\
                    a.cust_id\
                    ,a.full_name\
                    ,a.address\
                    ,b.sum_not_vat\
                    ,b.sum_vat\
                    ,b.sum_charge\
                    from\
                    customers a\
                    ,invoices  b\
                    where b.bill_cycle = '"+ req.paramS.bill_cycle + "'\
                    and a.staff_id='"+ req.paramS.staff_id + "'\
                    and a.id = b.customer_id\
                    ")
            .then(async results => {
                //lấy kết quả để in ra file
                //sau khi tạo được file thì đọc file trả kết quả cho user
                let staff_name = await db.getRst("select name from staffs where id = " + req.paramS.staff_id)
                let outputFilename = './bao-cao/VSMT.xlsx';
                fs.createReadStream('./templates/VSMT.xlsx').pipe(fs.createWriteStream(outputFilename));
                try {
                    await create_report_detail(results, req.paramS.bill_cycle, staff_name.name, outputFilename);
                    fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(JSON.stringify(err));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8' });
                            res.end(bufferPdf);
                        }
                    });
                } catch (err) {
                    //lỗi trong quá trình xuất file excel
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(JSON.stringify({ message: 'Lỗi khi tạo file excel', error: err }));
                }
            })
            .catch(err => {
                //lỗi thì trả kết quả về lỗi
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Lỗi truy vấn SQL', error: err }));
            })
    }

    /**
     * Lấy báo cáo chi tiết theo nhân viên, mỗi nhân viên một sheet
     * @param {*} req 
     * @param {*} res 
     * Tham số vào req.paramS.bill_cycle
     * 
     */
    async getReportStaffDetails(req, res) {
        let outputFilename = './bao-cao/VSMT.xlsx';
        fs.createReadStream('./templates/VSMT.xlsx').pipe(fs.createWriteStream(outputFilename));
        try {
            await create_report_staff_detail(req.paramS.bill_cycle, outputFilename);
            fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                if (err) {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(JSON.stringify(err));
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8' });
                    res.end(bufferPdf);
                }
            });
        } catch (err) {
            //lỗi trong quá trình xuất file excel
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(JSON.stringify({ message: 'Lỗi khi tạo file excel', error: err }));
        }
    }

    /**
     * Lấy báo cáo tổng hợp theo vùng
     * @param {*} req 
     * @param {*} res 
     * Tham số vào req.paramS.bill_cycle
     * 
     */
    getReportArea(req, res) {
        db.getRsts("select\
                    d.name as area_name,\
                    c.area_id,\
                    e.name as price_name,\
                    c.price_id,\
                    c.count_customer,\
                    c.sum_not_vat,\
                    c.sum_vat,\
                    c.sum_charge\
                    from\
                    (select\
                    a.area_id\
                    ,a.price_id\
                    , count(1) as count_customer\
                    , sum(b.sum_not_vat) as sum_not_vat\
                    , sum(b.sum_vat) as sum_vat\
                    , sum(b.sum_charge) as sum_charge\
                    from\
                    customers a\
                    , invoices  b\
                    where a.id = b.customer_id\
                    and b.bill_cycle='"+ req.paramS.bill_cycle + "'\
                    group by a.area_id, a.price_id) c, areas d, prices e\
                    where c.area_id = d.id\
                    and c.price_id = e.id\
                    order by area_id, price_id\
                    ")
            .then(async results => {
                //lấy kết quả để in ra file
                //sau khi tạo được file thì đọc file trả kết quả cho user
                let outputFilename = './bao-cao/VSMT.xlsx';
                fs.createReadStream('./templates/VSMT.xlsx').pipe(fs.createWriteStream(outputFilename));
                try {
                    await create_report_area(results, req.paramS.bill_cycle, outputFilename);
                    fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(JSON.stringify(err));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8' });
                            res.end(bufferPdf);
                        }
                    });
                } catch (err) {
                    //lỗi trong quá trình xuất file excel
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(JSON.stringify({ message: 'Lỗi khi tạo file excel', error: err }));
                }
            })
            .catch(err => {
                //lỗi thì trả kết quả về lỗi
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Lỗi đọc file', error: err }));
            })
    }

    /**
     * Lấy báo cáo tổng hợp theo nhân viên
     * @param {*} req 
     * @param {*} res 
     * Tham số vào req.paramS.bill_cycle
     * 
     */
    getReportStaff(req, res) {
        db.getRsts("select\
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
                    and b.bill_cycle='"+ req.paramS.bill_cycle + "'\
                    group by a.staff_id, a.price_id) c,\
                    staffs d,\
                    prices e\
                    where c.staff_id = d.id\
                    and c.price_id = e.id\
                    order by staff_id, price_id\
                    ")
            .then(async results => {
                //lấy kết quả để in ra file
                //sau khi tạo được file thì đọc file trả kết quả cho user
                let outputFilename = './bao-cao/VSMT.xlsx';
                fs.createReadStream('./templates/VSMT.xlsx').pipe(fs.createWriteStream(outputFilename));
                try {
                    await create_report_staff(results, req.paramS.bill_cycle, outputFilename);
                    fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(JSON.stringify(err));
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8' });
                            res.end(bufferPdf);
                        }
                    });
                } catch (err) {
                    //lỗi trong quá trình xuất file excel
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(JSON.stringify({ message: 'Lỗi khi tạo file excel', error: err }));
                }
            })
            .catch(err => {
                //lỗi thì trả kết quả về lỗi
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Lỗi đọc file', error: err }));
            })
    }

    /**
     * Lấy báo cáo tổng hợp và chi tiết
     * @param {*} req 
     * @param {*} res 
     * Tham số vào req.paramS.bill_cycle
     * 
     */
    async getReportExcel(req, res) {
        if (req.paramS
            && req.paramS.bill_cycle
        ) {
            let results_Staff =
                await db.getRsts("select\
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
                and b.bill_cycle='"+ req.paramS.bill_cycle + "'\
                group by a.staff_id, a.price_id) c,\
                staffs d,\
                prices e\
                where c.staff_id = d.id\
                and c.price_id = e.id\
                order by staff_id, price_id\
                ")

            let results_Area = await db.getRsts("select\
                d.name as area_name,\
                c.area_id,\
                e.name as price_name,\
                c.price_id,\
                c.count_customer,\
                c.sum_not_vat,\
                c.sum_vat,\
                c.sum_charge\
                from\
                (select\
                a.area_id\
                ,a.price_id\
                , count(1) as count_customer\
                , sum(b.sum_not_vat) as sum_not_vat\
                , sum(b.sum_vat) as sum_vat\
                , sum(b.sum_charge) as sum_charge\
                from\
                customers a\
                , invoices  b\
                where a.id = b.customer_id\
                and b.bill_cycle='"+ req.paramS.bill_cycle + "'\
                group by a.area_id, a.price_id) c, areas d, prices e\
                where c.area_id = d.id\
                and c.price_id = e.id\
                order by area_id, price_id\
                ")
            let outputFilename = './bao-cao/VSMT.xlsx';
            fs.createReadStream('./templates/VSMT.xlsx').pipe(fs.createWriteStream(outputFilename));
            try {
                await create_report_staff(results_Staff, req.paramS.bill_cycle, outputFilename);
                await create_report_area(results_Area, req.paramS.bill_cycle, outputFilename);
                await create_report_staff_detail(req.paramS.bill_cycle, outputFilename);
                //Đọc file kết quả để trả về client (nếu file kết quả không có gì cũng trả về không có gì)
                fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(JSON.stringify(err));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8' });
                        res.end(bufferPdf);
                    }
                });
            } catch (err) {
                //console.log(err)
                //lỗi trong quá trình xuất file excel
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Lỗi khi tạo file excel', error: err }));
            }
        } else {
            //không biết lấy kỳ nào nên trả về trang lỗi
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(JSON.stringify({ message: 'Tham số không phù hợp', error: 'Lỗi không biết bạn muốn gì? có phải hacker không nữa!' }));
        }
    }

}

module.exports = new ReportExcelHandler()