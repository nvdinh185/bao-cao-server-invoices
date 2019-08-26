const db = require("./db/sqlite3/db-pool");
const fs = require('fs');
const PDFDocument = require('pdfkit');

const arrObj = require("./utils/array-object");
const vnHandler = require("./utils/vietnamese-handler");

const create_pdf_report = async (bill_cycle, staff_id) => {
    let options = {
        size: 'A4',
        margin: 0,
    }
    let matrix_point = {
        zipper_row: 20, //khoang cach giua 2 dong
        zipper_col: 90, //khoang cach giua 2 cot
    }
    const number_per_page = 28;
    let n = 1;
    const offset_1 = 20;
    const doc = new PDFDocument(options);
    let out = fs.createWriteStream('./bao-cao/pdf.pdf')
    doc.pipe(out);
    //Khai bao font chữ
    doc.registerFont('Time-new-roman-utf8', './fonts/times.ttf');
    doc.registerFont('OpenSans-Bold', './fonts/OpenSans-Bold.ttf');
    for (let i = 0; ; i++) {
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
                                        order by a.cust_id\
                                        limit '"+ number_per_page + "'\
                                        offset '"+ (i * number_per_page) + "'\
                                        ")
        let staff_name = await db.getRst("select name from staffs where id = " + staff_id)
        //console.log(results.length)
        if (i > 0 && results.length > 0) doc.addPage()
        if (results.length > 0) {
            //sử dụng font chữ
            doc.font('OpenSans-Bold');
            //ghi tiêu đề của báo cáo
            doc.text('BÁO CÁO CHI TIẾT HỘ SỬ DỤNG DỊCH VỤ THU GOM RÁC THẢI THEO NHÂN VIÊN QUẢN LÝ', 0, matrix_point.zipper_row * 0 + offset_1, { align: 'center' })
            doc.text('Người quản lý: ' + staff_name.name, 0, matrix_point.zipper_row * 1 + offset_1, { align: 'center' })
            doc.text('Tháng: ' + bill_cycle, 0, matrix_point.zipper_row * 2 + offset_1, { align: 'center' })
            doc.font('Time-new-roman-utf8');
            doc.text('STT', matrix_point.zipper_col * 0.2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Mã KH', matrix_point.zipper_col * 0.6, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Họ đệm', matrix_point.zipper_col * 1.6, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Tên', matrix_point.zipper_col * 2.5, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Địa chỉ', matrix_point.zipper_col * 3, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Chưa thuế', matrix_point.zipper_col * 4.5, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Thuế', matrix_point.zipper_col * 5.3, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Tổng', matrix_point.zipper_col * 6, matrix_point.zipper_row * 4 + offset_1)
            //ghi nội dung của báo cáo
            results.forEach((el, idx) => {
                //tô màu nền cho những hàng có idx chắn
                if (idx % 2 == 0) {
                    doc.lineWidth(20)
                        .lineCap('butt')
                        .fillAndStroke("black", "#d5e8ed")
                        .moveTo(matrix_point.zipper_col * 0.2, matrix_point.zipper_row * (idx + 5) + offset_1 + 5)
                        .lineTo(matrix_point.zipper_col * 6.5, matrix_point.zipper_row * (idx + 5) + offset_1 + 5)
                        .stroke();
                }
                doc.text(n++, matrix_point.zipper_col * 0.2, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(el.cust_id, matrix_point.zipper_col * 0.6, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(vnHandler.splitFullName(el.full_name).last_name, matrix_point.zipper_col * 1.6, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(vnHandler.splitFullName(el.full_name).first_name, matrix_point.zipper_col * 2.5, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(el.address, matrix_point.zipper_col * 3, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(arrObj.numberWithSeparator(el.sum_not_vat), matrix_point.zipper_col * 4.5, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(arrObj.numberWithSeparator(el.sum_vat), matrix_point.zipper_col * 5.3, matrix_point.zipper_row * (idx + 5) + offset_1);
                doc.text(arrObj.numberWithSeparator(el.sum_charge), matrix_point.zipper_col * 6, matrix_point.zipper_row * (idx + 5) + offset_1);
            });
            doc.text('Trang ' + (i + 1), matrix_point.zipper_col * 6, matrix_point.zipper_row * 40)
        }
        if (results.length < number_per_page) break;
    }
    doc.end();
}

create_pdf_report("201906", "1")