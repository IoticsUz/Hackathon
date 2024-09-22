const { Router } = require("express");
const { loginRouter } = require("./auth/login");
const { adminRouter } = require("./admin/admin");
const { meterRouter } = require("./meter/meter");
const { notFound } = require("../controller");
const { billingRouter } = require("./server/billing");
const { folderRouter } = require("./server/folder");
const { journalRouter } = require("./server/journal");
const { dashboardRouter } = require("./graphics/dashboard");
const { graphRouter } = require("./graphics/graph");
const { vectorRouter } = require("./graphics/vector");
const { calculationRouter } = require("./electricity/calculation_object");
const { electRouter } = require("./electricity/elect_object");
const { sendMessage } = require("../controller/server/send_message");
const { licenseRouter } = require("./server/license");

module.exports.router = Router()
    .use('/', loginRouter)
    .use('/admin', adminRouter)
    .use('/meter', meterRouter)
    .use('/billing', billingRouter)
    .use('/folder', folderRouter)
    .use('/journal', journalRouter)
    .use('/graph', graphRouter)
    .use('/license', licenseRouter)
    .use('/electricity', electRouter)
    .use('/vector', vectorRouter)
    .use('/calculation', calculationRouter)
    .use('/dashboard', dashboardRouter)
    .use('/send-message', sendMessage)
    .use('/*', notFound)
