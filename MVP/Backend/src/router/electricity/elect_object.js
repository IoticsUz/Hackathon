const { Router } = require("express");
const { getQuery } = require("../../validation/elect_object");
const { getElectricityObjects, getSingleElectricityObject, listUseMeterElectFn, factories, getFirstTemplate } = require("../../controller/electricity/electricity_object");
const { firstReportJoi } = require("../../validation/billing");
const { adminToken_superToken } = require("../../middleware/admin_or_super_token");
const { validateQuery } = require("../../middleware/validate_query");

module.exports.electRouter = Router()
    .get('/list', adminToken_superToken, getElectricityObjects)
    .get('/meter-use', adminToken_superToken, listUseMeterElectFn)
    .get('/factories', adminToken_superToken, factories)
    .get('/report/:id', adminToken_superToken, validateQuery(firstReportJoi), getFirstTemplate)
    .get('/single/:id', adminToken_superToken, validateQuery(getQuery), getSingleElectricityObject)
