const { Router } = require("express");
const { getListMeter, getOneMeter, meterList } = require("../../controller/meter/meter");
const { adminToken_superToken } = require("../../middleware/admin_or_super_token");

module.exports.meterRouter = Router()
    .get('/list', adminToken_superToken, getListMeter)
    .get('/one/:id', adminToken_superToken, getOneMeter)
    .get('/meter-list', adminToken_superToken, meterList)
