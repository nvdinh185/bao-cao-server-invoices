* Định nghĩa file excel để tạo csdl gồm:
- 1 bảng invoices: chứa danh sách các hoá đơn
- 1 bảng customers: chứa danh sách các khách hàng
- 1 bảng areas: chứa danh sách các khu vực
- 1 bảng staffs: chứa danh sách các nhân viên
- Tạo csdl từ file excel (dùng service được định nghĩa trước)


1. file create-pdf-report.js: Tạo ra file pdf BÁO CÁO CHI TIẾT THEO NHÂN VIÊN QUẢN LÝ
- Lấy dữ liệu trong table CUSTOMERS và INVOICES và in ra file pdf theo từng trang

2. file create-pdf-qld.js: Tạo ra file pdf BÁO CÁO TỔNG HỢP theo khu vực
lấy dữ liệu trong table CUSTOMERS và INVOICES
- Có tính tổng khi tổng hợp xong

3. file create-sqlite-report-excel-detail.js: Tạo file excel BÁO CÁO CHI TIẾT theo NHÂN VIÊN QUẢN LÝ
(đọc file sheet mẫu và ghi dữ liệu vào, nhớ kiểm tra mảng kết quả trước khi ghi)
- Lấy dữ liệu từ trong table CUSTOMERS và INVOICES và ghi ra 1 file excel, trên 1 sheet

4. file create-sqlite-report-excel-staff-detail.js: Tạo file excel BÁO CÁO CHI TIẾT với mỗi nhân viên một sheet,
lấy dữ liệu từ trong table CUSTOMERS và INVOICES
5. file create-sqlite-report-excel-area.js: Tạo file excel BÁO CÁO TỔNG HỢP theo khu vực
6. file create-sqlite-report-excel-staff.js: Tạo file excel BÁO CÁO TỔNG HỢP theo nhân viên

Tạo server trả về các dữ liệu
a. file report-pdf-handler-dinh.js: Có các server trả về:
	1. File pdf báo cáo chi tiết theo chu kỳ, nhân viên quản lý
	2. File pdf báo cáo tổng hợp theo nhân viên quản lý
	3. File pdf báo cáo tổng hợp theo khu vực
	
b. file report-excel-handler-dinh.js: Có server trả về các file excel:
	1. File excel báo cáo chi tiết theo nhân viên quản lý
	2. File excel báo cáo chi tiết theo mỗi nhân viên 1 sheet
	3. File excel báo cáo tổng hợp theo khu vực
	4. File excel báo cáo tổng hợp theo nhân viên quản lý
	5. File excel báo cáo tổng hợp và chi tiết mỗi nhân viên một sheet