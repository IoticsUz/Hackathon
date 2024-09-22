const { Router } = require("express");
const { getElectricityObjectsCalculation, getSingleElectricityObjectCalculation, calculationMain, getFirstTemplateReport } = require("../../controller/electricity/calculation_object");
const { firstReportJoi } = require("../../validation/billing");
const { adminToken_superToken } = require("../../middleware/admin_or_super_token");
const { validateQuery } = require("../../middleware/validate_query");

module.exports.calculationRouter = Router()
    .get('/list', adminToken_superToken, getElectricityObjectsCalculation)
    .get('/single/:id', adminToken_superToken, getSingleElectricityObjectCalculation)
    .get('/factories', adminToken_superToken, calculationMain)
    .get('/report/:id', adminToken_superToken, validateQuery(firstReportJoi), getFirstTemplateReport)
