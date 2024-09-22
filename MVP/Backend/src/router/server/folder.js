const { Router } = require("express");
const { adminToken_superToken } = require("../../middleware/admin_or_super_token");
const { validateQuery } = require("../../middleware/validate_query");
const { getSingleFolder, getListFolders, folderStatus, getParentFolder } = require("../../controller/server/folder");
const { folderGetJoi} = require("../../validation/folder");

module.exports.folderRouter = Router()
    .get('/list', adminToken_superToken, validateQuery(folderGetJoi), getListFolders)
    .get('/one/:id', adminToken_superToken, getSingleFolder)
    .get('/parents-list', getParentFolder)
    .get('/status/:id', adminToken_superToken, folderStatus)
