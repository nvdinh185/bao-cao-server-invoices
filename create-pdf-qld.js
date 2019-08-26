const db = require("./db/sqlite3/db-pool");
const fs = require('fs');
const PDFDocument = require('pdfkit');

const arrObj = require("./utils/array-object");
const vnHandler = require("./utils/vietnamese-handler");

const create_pdf_report = async (bill_cycle) => {
    let options = {
        size: 'A4',
        margin: 0,
    }
    let matrix_point = {
        zipper_row: 20, //khoang cach giua 2 dong
        zipper_col: 90, //khoang cach giua 2 cot
    }
    const number_per_page = 32;
    const offset_1 = 40;//khoang cach voi le tren
    const offset_2 = 10;//khoang cach voi le trai

    //Tính tổng
    var count_customer = 0;
    var sum_not_vat = 0;
    var sum_vat = 0;
    var sum_charge = 0;

    //cac bien toan cuc
    let index = 1;
    let last_row;

    const doc = new PDFDocument(options);
    let out = fs.createWriteStream('./bao-cao/pdf.pdf')
    doc.pipe(out);
    doc.registerFont('Time-new-roman-utf8', './fonts/times.ttf');
    doc.registerFont('OpenSans-Bold', './fonts/OpenSans-Bold.ttf');
    let results = await db.getRsts("select\
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
                                    and b.bill_cycle='"+ bill_cycle + "'\
                                    group by a.area_id, a.price_id) c, areas d, prices e\
                                    where c.area_id = d.id\
                                    and c.price_id = e.id\
                                    order by area_id, price_id\
                                    ")
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
            doc.text('BÁO CÁO TỔNG HỢP HỘ SỬ DỤNG DỊCH VỤ THU GOM RÁC THẢI THEO KHU VỰC', 0, matrix_point.zipper_row * 0 + offset_1, { align: 'center' })
            doc.text('Tháng: ' + arrObj.convertMonthYear(bill_cycle), 0, matrix_point.zipper_row * 1 + offset_1, { align: 'center' })

            //Ghi tiêu đề của bảng
            doc.lineWidth(20)
                .lineCap('butt')
                .strokeColor("blue", 0.2)
                .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, matrix_point.zipper_row * 4 + offset_1 + 8)
                .lineTo(matrix_point.zipper_col * 6.2 + offset_2 + 5, matrix_point.zipper_row * 4 + offset_1 + 8)
                .stroke();
            doc.text('STT', matrix_point.zipper_col * 0.2 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Khu vực', matrix_point.zipper_col * 0.6 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Loại Khách Hàng', matrix_point.zipper_col * 1.8 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Số Lượng KH', matrix_point.zipper_col * 3.2 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Chưa thuế', matrix_point.zipper_col * 4.2 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Thuế', matrix_point.zipper_col * 5.1 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            doc.text('Tổng', matrix_point.zipper_col * 5.7 + offset_2, matrix_point.zipper_row * 4 + offset_1)
            //Ghi content cua trang
            doc.font('Time-new-roman-utf8');
            data.forEach((el, idx) => {
                count_customer += el.count_customer;
                sum_not_vat += el.sum_not_vat
                sum_vat += el.sum_vat
                sum_charge += el.sum_charge
                last_row = matrix_point.zipper_row * (idx + 5) + offset_1;
                if (idx % 2 !== 0) {
                    doc.lineWidth(20)
                        .lineCap('butt')
                        .strokeColor("blue", 0.1)
                        .moveTo(matrix_point.zipper_col * 0.2 + offset_2 - 5, last_row + 5)
                        .lineTo(matrix_point.zipper_col * 6.2 + offset_2 + 5, last_row + 5)
                        .stroke();
                }
                doc.text(index++, matrix_point.zipper_col * 0.2 + offset_2, last_row);
                doc.text(el.area_name, matrix_point.zipper_col * 0.5 + offset_2, last_row);
                doc.text(el.price_name, matrix_point.zipper_col * 1.8 + offset_2, last_row);
                doc.text(el.count_customer, matrix_point.zipper_col * 3.2 + offset_2, last_row, { width: 75, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_not_vat), matrix_point.zipper_col * 4.2 + offset_2, last_row, { width: 60, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_vat), matrix_point.zipper_col * 5.1 + offset_2, last_row, { width: 40, align: 'right' });
                doc.text(arrObj.numberWithSeparator(el.sum_charge), matrix_point.zipper_col * 5.7 + offset_2, last_row, { width: 50, align: 'right' });
            })
        }
        doc.text('Trang ' + (i + 1), matrix_point.zipper_col * 5.8, matrix_point.zipper_row * 40);
        if (20 < data.length) {
            doc.addPage();
            last_row = 0;
        }
        if (data.length < number_per_page) break;
    }
    doc.text("Số lượng khách hàng: ", matrix_point.zipper_col * 2 + offset_2, last_row + 2 * matrix_point.zipper_row)
    doc.text(count_customer, matrix_point.zipper_col * 2 + offset_2, last_row + 2 * matrix_point.zipper_row, { width: 200, align: 'right' })
    doc.text("Tổng tiền chưa thuế: ", matrix_point.zipper_col * 2 + offset_2, last_row + 3 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(sum_not_vat), matrix_point.zipper_col * 2 + offset_2, last_row + 3 * matrix_point.zipper_row, { width: 200, align: 'right' })
    doc.text("Tổng tiền thuế: ", matrix_point.zipper_col * 2 + offset_2, last_row + 4 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(sum_vat), matrix_point.zipper_col * 2 + offset_2, last_row + 4 * matrix_point.zipper_row, { width: 200, align: 'right' })
    doc.text("Tổng tiền: ", matrix_point.zipper_col * 2 + offset_2, last_row + 5 * matrix_point.zipper_row)
    doc.text(arrObj.numberWithSeparator(sum_charge), matrix_point.zipper_col * 2 + offset_2, last_row + 5 * matrix_point.zipper_row, { width: 200, align: 'right' })
    doc.text("Bằng chữ: " + vnHandler.StringVietnamDong(sum_charge), matrix_point.zipper_col * 2 + offset_2, last_row + 6 * matrix_point.zipper_row)

    doc.end();
}

create_pdf_report("201901")