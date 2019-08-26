"use strict"
const router = require('express').Router();
const pdfHandlers = require('../handlers/report-pdf-handler-dinh');
const excelHandlers = require('../handlers/report-excel-handler-dinh');

router.get('/pdf-report-detail'
    , pdfHandlers.getReportDetail);

router.get('/pdf-report-area'
    , pdfHandlers.getReportArea);

router.get('/pdf-report-staff'
    , pdfHandlers.getReportStaff);

router.get('/excel-detail'
    , excelHandlers.getReportDetail);

router.get('/excel-staff-detail'
    , excelHandlers.getReportStaffDetails);

router.get('/excel-area'
    , excelHandlers.getReportArea);

router.get('/excel-staff'
    , excelHandlers.getReportStaff);

router.get('/excel'
    , excelHandlers.getReportExcel);

module.exports = router;