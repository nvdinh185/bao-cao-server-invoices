"use strict"

/**
 * ver 1.0 
 * dinh.nv
 * ngày 05/07/2019
 * Tạo báo cáo xuất file pdf
 * 
 */

const vnHandler = require('../utils/vietnamese-handler');

const arrObj = require('../utils/array-object');
const db = require('../db/sqlite3/db-pool');

const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Tạo báo cáo chi tiết theo nhân viên
 * @param {*} results 
 * @param {*} staff_name 
 * @param {*} bill_cycle 
 * @param {*} outputFilename 
 */
const createPdfReportDetail = (results, staff_name, bill_cycle, outputFilename) => {

    let options = {
        size: 'A4',//tuy chon giay a4
        margin: 0,
    }

    let doc = new PDFDocument(options); //tao tai lieu pdf

    var stream = doc.pipe(fs.createWriteStream(outputFilename));

    //quyen tac gia cua file pdf
    doc.info['Title'] = 'Mẫu in bao cao A4 1 trang';
    doc.info['Author'] = 'Đoàn Quốc Cường';

    //dang ky font chu
    doc.registerFont('Time-new-roman-utf8', './fonts/times.ttf');
    doc.registerFont('OpenSans-Bold', './fonts/OpenSans-Bold.ttf');

    const offset_1 = 40;//khoang cach voi le tren
    const offset_2 = 10;//khoang cach voi le trai

    //thiet lap cac khoang cach dong va cot
    const matrix_point = {
        zipper_row: 20, //khoang cach giua 2 dong
        zipper_col: 90, //khoang cach giua 2 cot
    }
    const number_per_page = 32;//so luong ban ghi tren 1 trang

    //mau mac dinh cua chu
    var defaultColor = 'black';

    //thiet lap mau chu default
    doc.fillColor(defaultColor)

    //tinh tong tien
    let sum_not_vat = 0;
    let sum_vat = 0;
    let sum_charge = 0;

    //cac bien toan cuc
    let index = 1;
    let last_row;

    //duyet tat ca cac ban ghi va in ra file pdf
    for (let i = 0; ; i++) {
        let data = []
        results.forEach((el, idx) => {
            if (idx >= i * number_per_page && idx < (i + 1) * number_per_page)
                data.push(el)
        })
        if (data.length > 0) {
            //Ghi header cua trang
            doc.font('OpenSans-Bold');
            doc.text('BÁO CÁO CHI TIẾT HỘ SỬ DỤNG DỊCH VỤ THU GOM RÁC THẢI THEO NHÂN VIÊN QUẢN LÝ', 0, matrix_point.zipper_row * 0 + offset_1, { align: 'center' })
            doc.text('Người quản lý: ' + staff_name, 0, matrix_point.zipper_row * 1 + offset_1, { align: 'center' })
            doc.text('Tháng: ' + arrObj.convertMonthYear(bill_cycle), 0, matrix_point.zipper_row * 2 + offset_1, { align: 'center' })

            //Ghi tiêu đề của bảng
            doc.lineWidth(20)
                .lineCap('butt')
                .strokeColor("blue", 0.2)
                .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, matrix_point.zipper_row * 4 + offset_1 + 8)
                .lineTo(matrix_point.zipper_col * 6.2 + offset_2, matrix_point.zipper_row * 4 + offset_1 + 8)
                .stroke();
            doc.text('STT', matrix_point.zipper_col * 0.2 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Mã KH', matrix_point.zipper_col * 0.6 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Họ đệm', matrix_point.zipper_col * 1.6 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Tên', matrix_point.zipper_col * 2.5 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Địa chỉ', matrix_point.zipper_col * 3 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Chưa thuế', matrix_point.zipper_col * 4.3 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Thuế', matrix_point.zipper_col * 5.2 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Tổng', matrix_point.zipper_col * 5.8 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            //Ghi content cua trang
            doc.font('Time-new-roman-utf8');
            data.forEach((el, idx) => {
                sum_not_vat += el.sum_not_vat
                sum_vat += el.sum_vat
                sum_charge += el.sum_charge
                if (idx % 2 !== 0) {
                    doc.lineWidth(20)
                        .lineCap('butt')
                        .strokeColor("blue", 0.1)
                        .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, matrix_point.zipper_row * (idx + 5) + offset_1 + 5)
                        .lineTo(matrix_point.zipper_col * 6.2 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1 + 5)
                        .stroke();
                }
                doc.text(index++, matrix_point.zipper_col * 0.2 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(el.cust_id, matrix_point.zipper_col * 0.6 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(vnHandler.splitFullName(el.full_name).last_name, matrix_point.zipper_col * 1.6 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(vnHandler.splitFullName(el.full_name).first_name, matrix_point.zipper_col * 2.5 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(el.address, matrix_point.zipper_col * 3 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(arrObj.numberWithSeparator(el.sum_not_vat), matrix_point.zipper_col * 4.3 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(arrObj.numberWithSeparator(el.sum_vat), matrix_point.zipper_col * 5.2 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(arrObj.numberWithSeparator(el.sum_charge), matrix_point.zipper_col * 5.8 + offset_2, matrix_point.zipper_row * (idx + 5) + offset_1);
                last_row = matrix_point.zipper_row * (idx + 5) + offset_1;
            })
            doc.text('Trang ' + (i + 1), matrix_point.zipper_col * 5.8, matrix_point.zipper_row * 40);
        }
        if (20 < data.length) {
            doc.addPage();
            last_row = 0;
        }
        if (data.length < number_per_page) break;
    }
    //Ghi footer cua trang
    doc.text("Tổng tiền chưa thuế: ", matrix_point.zipper_col * 2 + offset_2, last_row + 2 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(sum_not_vat), matrix_point.zipper_col * 2 + offset_2, last_row + 2 * matrix_point.zipper_row, { width: 200, align: 'right' })
    doc.text("Tổng tiền thuế: ", matrix_point.zipper_col * 2 + offset_2, last_row + 3 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(sum_vat), matrix_point.zipper_col * 2 + offset_2, last_row + 3 * matrix_point.zipper_row, { width: 200, align: 'right' })
    doc.text("Tổng tiền: ", matrix_point.zipper_col * 2 + offset_2, last_row + 4 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(sum_charge), matrix_point.zipper_col * 2 + offset_2, last_row + 4 * matrix_point.zipper_row, { width: 200, align: 'right' })
    doc.text("Bằng chữ: " + vnHandler.StringVietnamDong(sum_charge), matrix_point.zipper_col * 2 + offset_2, last_row + 5 * matrix_point.zipper_row)

    doc.end();

    return stream;

}

/**
 * Tạo báo cáo tổng hợp theo nhân viên
 * @param {*} results 
 * @param {*} bill_cycle 
 * @param {*} outputFilename 
 */
const createPdfReportStaff = (results, bill_cycle, outputFilename) => {
    let options = {
        size: 'A4',//tuy chon giay a4
        margin: 0,
    }

    let doc = new PDFDocument(options); //tao tai lieu pdf

    var stream = doc.pipe(fs.createWriteStream(outputFilename));

    //quyen tac gia cua file pdf
    doc.info['Title'] = 'Mẫu in bao cao A4 1 trang';
    doc.info['Author'] = 'Đoàn Quốc Cường';

    //dang ky font chu
    doc.registerFont('Time-new-roman-utf8', './fonts/times.ttf');
    doc.registerFont('OpenSans-Bold', './fonts/OpenSans-Bold.ttf');

    const offset_1 = 40;//khoang cach voi le tren
    const offset_2 = 5;//khoang cach voi le trai

    //thiet lap cac khoang cach dong va cot
    const matrix_point = {
        zipper_row: 20, //khoang cach giua 2 dong
        zipper_col: 90, //khoang cach giua 2 cot
    }
    const number_per_page = 32;//so luong ban ghi tren trang

    //mau mac dinh cua chu
    var defaultColor = 'black';

    //thiet lap mau chu default
    doc.fillColor(defaultColor)

    //tinh tong tien
    let count_customer = 0;
    let sum_not_vat = 0;
    let sum_vat = 0;
    let sum_charge = 0;

    //cac bien toan cuc
    let index = 1;
    let last_row;

    //duyet tat ca cac ban ghi va in ra file pdf
    for (let i = 0; ; i++) {
        let data = []
        results.forEach((el, idx) => {
            if (idx >= i * number_per_page && idx < (i + 1) * number_per_page)
                data.push(el)
        })
        if (data.length > 0) {
            //Ghi header cua trang
            doc.fontSize(16);
            doc.font('OpenSans-Bold');
            doc.text('BÁO CÁO TỔNG HỢP HỘ SỬ DỤNG DỊCH VỤ THU GOM RÁC THẢI THEO NHÂN VIÊN', 95 / 2, matrix_point.zipper_row * 0 + offset_1, { width: 500, align: 'center' })
            doc.text('Tháng: ' + arrObj.convertMonthYear(bill_cycle), 0, matrix_point.zipper_row * 2 + offset_1, { align: 'center' })

            //Ghi tiêu đề của bảng
            doc.lineWidth(20)
                .lineCap('butt')
                .strokeColor("blue", 0.2)
                .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, matrix_point.zipper_row * 5 + offset_1 + 8)
                .lineTo(matrix_point.zipper_col * 6.2 + offset_2 + 5, matrix_point.zipper_row * 5 + offset_1 + 8)
                .stroke();
            doc.fontSize(12);
            doc.text('STT', matrix_point.zipper_col * 0.2 + offset_2, matrix_point.zipper_row * 5 + offset_1)
            doc.text('Người quản lý', matrix_point.zipper_col * 0.6 + offset_2, matrix_point.zipper_row * 5 + offset_1)
            doc.text('Loại Khách Hàng', matrix_point.zipper_col * 1.8 + offset_2, matrix_point.zipper_row * 5 + offset_1)
            doc.text('SL KH', matrix_point.zipper_col * 3.1 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 35, align: 'right' })
            doc.text('Chưa thuế', matrix_point.zipper_col * 3.8 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 65, align: 'right' })
            doc.text('Thuế', matrix_point.zipper_col * 4.8 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 55, align: 'right' })
            doc.text('Tổng', matrix_point.zipper_col * 5.5 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 65, align: 'right' })
            //Ghi content cua trang
            doc.font('Time-new-roman-utf8');
            data.forEach((el, idx) => {
                count_customer += el.count_customer
                sum_not_vat += el.sum_not_vat
                sum_vat += el.sum_vat
                sum_charge += el.sum_charge
                if (idx % 2 !== 0) {
                    doc.lineWidth(20)
                        .lineCap('butt')
                        .strokeColor("blue", 0.1)
                        .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, matrix_point.zipper_row * (idx + 6) + offset_1 + 5)
                        .lineTo(matrix_point.zipper_col * 6.2 + offset_2 + 5, matrix_point.zipper_row * (idx + 6) + offset_1 + 5)
                        .stroke();
                }
                doc.text(index++, matrix_point.zipper_col * 0.2 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1);
                doc.text(el.staff_name, matrix_point.zipper_col * 0.6 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1);
                doc.text(el.price_name, matrix_point.zipper_col * 1.8 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1);
                doc.text(el.count_customer, matrix_point.zipper_col * 3.1 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 35, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_not_vat), matrix_point.zipper_col * 3.8 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 65, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_vat), matrix_point.zipper_col * 4.8 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 55, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_charge), matrix_point.zipper_col * 5.5 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 65, align: 'right' });
                last_row = matrix_point.zipper_row * (idx + 6) + offset_1;
            })
        }
        doc.text('Trang ' + (i + 1), matrix_point.zipper_col * 5.8, matrix_point.zipper_row * 40);
        if (20 < data.length) {
            doc.addPage();
            last_row = 0;
        }
        if (data.length < number_per_page) break;
    }
    //Ghi footer cua trang
    doc.font('OpenSans-Bold');
    doc.text("Tổng: ", matrix_point.zipper_col * 0.6 + offset_2, last_row + 1 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(count_customer), matrix_point.zipper_col * 3.1 + offset_2, last_row + matrix_point.zipper_row, { width: 35, align: 'right' })
    doc.text(arrObj.numberWithSeparator(sum_not_vat), matrix_point.zipper_col * 3.8 + offset_2, last_row + matrix_point.zipper_row, { width: 65, align: 'right' })
    doc.text(arrObj.numberWithSeparator(sum_vat), matrix_point.zipper_col * 4.8 + offset_2, last_row + matrix_point.zipper_row, { width: 55, align: 'right' })
    doc.text(arrObj.numberWithSeparator(sum_charge), matrix_point.zipper_col * 5.5 + offset_2, last_row + matrix_point.zipper_row, { width: 65, align: 'right' })
    doc.text("Bằng chữ: ", matrix_point.zipper_col * 0.6 + offset_2, last_row + 2 * matrix_point.zipper_row)
    doc.text(vnHandler.StringVietnamDong(sum_charge), matrix_point.zipper_col * 2 + offset_2, last_row + 2 * matrix_point.zipper_row)

    doc.end();

    return stream;
}

/**
 * Tạo báo cáo tổng hợp theo vùng
 * @param {*} results 
 * @param {*} bill_cycle 
 * @param {*} outputFilename 
 */
const createPdfReportArea = (results, bill_cycle, outputFilename) => {

    let options = {
        size: 'A4',//tuy chon giay a4
        margin: 0,
    }

    let doc = new PDFDocument(options); //tao tai lieu pdf

    var stream = doc.pipe(fs.createWriteStream(outputFilename));

    //quyen tac gia cua file pdf
    doc.info['Title'] = 'Mẫu in bao cao A4 1 trang';
    doc.info['Author'] = 'Đoàn Quốc Cường';

    //dang ky font chu
    doc.registerFont('Time-new-roman-utf8', './fonts/times.ttf');
    doc.registerFont('OpenSans-Bold', './fonts/OpenSans-Bold.ttf');

    const offset_1 = 40;//khoang cach voi le tren
    const offset_2 = 5;//khoang cach voi le trai

    //thiet lap cac khoang cach dong va cot
    const matrix_point = {
        zipper_row: 20, //khoang cach giua 2 dong
        zipper_col: 90, //khoang cach giua 2 cot
    }
    const number_per_page = 32;//so luong ban ghi tren trang

    //mau mac dinh cua chu
    var defaultColor = 'black';

    //thiet lap mau chu default
    doc.fillColor(defaultColor)

    //tinh tong tien
    var count_customer = 0;
    let sum_not_vat = 0;
    let sum_vat = 0;
    let sum_charge = 0;

    //cac bien toan cuc
    let index = 1;
    let last_row;

    //duyet tat ca cac ban ghi va in ra file pdf
    for (let i = 0; ; i++) {
        let data = []
        results.forEach((el, idx) => {
            if (idx >= i * number_per_page && idx < (i + 1) * number_per_page)
                data.push(el)
        })
        if (data.length > 0) {
            //Ghi header cua trang
            doc.fontSize(16);
            doc.font('OpenSans-Bold');
            doc.text('BÁO CÁO TỔNG HỢP TÌNH HÌNH SỬ DỤNG DỊCH VỤ THU GOM RÁC THẢI TOÀN ĐƠN VỊ THEO KHU VỰC', 95 / 2, matrix_point.zipper_row * 0 + offset_1, { width: 500, align: 'center' })
            doc.text('Tháng: ' + arrObj.convertMonthYear(bill_cycle), 0, matrix_point.zipper_row * 2 + offset_1, { align: 'center' })

            //Ghi tiêu đề của bảng
            doc.lineWidth(20)
                .lineCap('butt')
                .strokeColor("blue", 0.2)
                .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, matrix_point.zipper_row * 5 + offset_1 + 8)
                .lineTo(matrix_point.zipper_col * 6.2 + offset_2 + 5, matrix_point.zipper_row * 5 + offset_1 + 8)
                .stroke();
            doc.fontSize(12);
            doc.text('STT', matrix_point.zipper_col * 0.2 + offset_2, matrix_point.zipper_row * 5 + offset_1)
            doc.text('Khu vực', matrix_point.zipper_col * 0.6 + offset_2, matrix_point.zipper_row * 5 + offset_1)
            doc.text('Loại Khách Hàng', matrix_point.zipper_col * 1.9 + offset_2, matrix_point.zipper_row * 5 + offset_1)
            doc.text('SL KH', matrix_point.zipper_col * 3.1 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 35, align: 'right' })
            doc.text('Chưa thuế', matrix_point.zipper_col * 3.8 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 65, align: 'right' })
            doc.text('Thuế', matrix_point.zipper_col * 4.8 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 55, align: 'right' })
            doc.text('Tổng', matrix_point.zipper_col * 5.5 + offset_2, matrix_point.zipper_row * 5 + offset_1, { width: 65, align: 'right' })
            //Ghi content cua trang
            doc.font('Time-new-roman-utf8');
            data.forEach((el, idx) => {
                count_customer += el.count_customer;
                sum_not_vat += el.sum_not_vat
                sum_vat += el.sum_vat
                sum_charge += el.sum_charge
                if (idx % 2 !== 0) {
                    doc.lineWidth(20)
                        .lineCap('butt')
                        .strokeColor("blue", 0.1)
                        .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, matrix_point.zipper_row * (idx + 6) + offset_1 + 5)
                        .lineTo(matrix_point.zipper_col * 6.2 + offset_2 + 5, matrix_point.zipper_row * (idx + 6) + offset_1 + 5)
                        .stroke();
                }
                doc.text(index++, matrix_point.zipper_col * 0.2 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1);
                doc.text(el.area_name, matrix_point.zipper_col * 0.6 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1);
                doc.text(el.price_name, matrix_point.zipper_col * 1.9 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1);
                doc.text(el.count_customer, matrix_point.zipper_col * 3.1 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 35, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_not_vat), matrix_point.zipper_col * 3.8 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 65, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_vat), matrix_point.zipper_col * 4.8 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 55, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_charge), matrix_point.zipper_col * 5.5 + offset_2, matrix_point.zipper_row * (idx + 6) + offset_1, { width: 65, align: 'right' });
                last_row = matrix_point.zipper_row * (idx + 6) + offset_1;
            })
        }
        doc.text('Trang ' + (i + 1), matrix_point.zipper_col * 5.8, matrix_point.zipper_row * 40);
        if (20 < data.length) {
            doc.addPage();
            last_row = 0;
        }
        if (data.length < number_per_page) break;
    }
    //Ghi footer cua trang
    doc.font('OpenSans-Bold');
    doc.text("Tổng: ", matrix_point.zipper_col * 0.6 + offset_2, last_row + 1 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(count_customer), matrix_point.zipper_col * 3.1 + offset_2, last_row + matrix_point.zipper_row, { width: 35, align: 'right' })
    doc.text(arrObj.numberWithSeparator(sum_not_vat), matrix_point.zipper_col * 3.8 + offset_2, last_row + matrix_point.zipper_row, { width: 65, align: 'right' })
    doc.text(arrObj.numberWithSeparator(sum_vat), matrix_point.zipper_col * 4.8 + offset_2, last_row + matrix_point.zipper_row, { width: 55, align: 'right' })
    doc.text(arrObj.numberWithSeparator(sum_charge), matrix_point.zipper_col * 5.5 + offset_2, last_row + matrix_point.zipper_row, { width: 65, align: 'right' })
    doc.text("Bằng chữ: ", matrix_point.zipper_col * 0.6 + offset_2, last_row + 2 * matrix_point.zipper_row)
    doc.text(vnHandler.StringVietnamDong(sum_charge), matrix_point.zipper_col * 2 + offset_2, last_row + 2 * matrix_point.zipper_row)

    doc.end();

    return stream;

}


class ReportPdfHandler {

    /**
     * Lấy báo cáo chi tiết theo chu kỳ, nhân viên
     * @param {*} req 
     * @param {*} res 
     * Tham số vào req.paramS.bill_cycle, req.paramS.staff_id
     * 
     */
    getReportDetail(req, res) {
        db.getRsts("select\
                a.cust_id\
                ,a.last_name\
                ,a.first_name\
                ,a.full_name\
                ,a.address\
                ,b.sum_not_vat\
                ,b.sum_vat\
                ,b.sum_charge\
                from\
                customers a\
                ,invoices  b\
                where a.id = b.customer_id\
                and b.bill_cycle = '"+ req.paramS.bill_cycle + "'\
                and a.staff_id='"+ req.paramS.staff_id + "'\
                order by a.staff_id, a.area_id, a.first_name, a.last_name, a.cust_id\
                ")
            .then(async results => {
                //lấy kết quả để in ra file
                //sau khi tạo được file thì đọc file trả kết quả cho user

                let outputFilename = './user-outputs/report_' + req.paramS.bill_cycle + '_' + req.paramS.staff_id + '.pdf';

                let rowStaff = await db.getRst("select name from staffs where id = " + req.paramS.staff_id)

                let stream = createPdfReportDetail(results, rowStaff.name, req.paramS.bill_cycle, outputFilename);

                stream.on('finish', () => {
                    fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(JSON.stringify(err));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/pdf; charset=utf-8' });
                        res.end(bufferPdf);
                    });
                });
            })
            .catch(err => {
                //lỗi thì trả kết quả về lỗi
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Lỗi đọc file pdf', error: err }));
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

                let outputFilename = './user-outputs/report_staff_' + req.paramS.bill_cycle + '.pdf';

                let stream = createPdfReportStaff(results, req.paramS.bill_cycle, outputFilename);

                stream.on('finish', () => {
                    fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(JSON.stringify(err));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/pdf; charset=utf-8' });
                        res.end(bufferPdf);
                    });
                });
            })
            .catch(err => {
                //lỗi thì trả kết quả về lỗi
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Lỗi đọc file pdf', error: err }));
            })
    }

    /**
     * Lấy báo cáo tổng hợp theo khu vực
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

                let outputFilename = './user-outputs/report_area_' + req.paramS.bill_cycle + '.pdf';

                let stream = createPdfReportArea(results, req.paramS.bill_cycle, outputFilename);

                stream.on('finish', () => {
                    fs.readFile(outputFilename, { flag: 'r' }, (err, bufferPdf) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(JSON.stringify(err));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/pdf; charset=utf-8' });
                        res.end(bufferPdf);
                    });
                });
            })
            .catch(err => {
                //lỗi thì trả kết quả về lỗi
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(JSON.stringify({ message: 'Lỗi đọc file pdf', error: err }));
            })
    }
}

module.exports = new ReportPdfHandler()