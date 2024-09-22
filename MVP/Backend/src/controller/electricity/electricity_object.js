const CustomError = require("../../utils/custom_error")
const repo = require("../../repository")
const { formatParamsList } = require("../../global/file-path")
const { sortvalueObjectsForFirstReport } = require("../../utils/sortvalue_bydate")
const { uniqueShortNames, obisFilter } = require("../../utils/unique_short-names")

module.exports.getElectricityObjects = async (req, res) => {
   try {
      const { list } = req
      const objectDocuments = await repo.repositories().electObjectRepository().findAll({ type: "factory", list })

      res.status(200).json({ status: 200, error: null, data: objectDocuments })
   } catch (err) {
      const error = new CustomError(err.status, err.message)
      res.status(error.status).json({ status: error.status, error: error.message, data: null })
   }
}

module.exports.getSingleElectricityObject = async (req, res) => {
   try {
      const { id } = req.params

      const objectDocument = await repo.repositories().electObjectRepository().findOne(id, req.data)
      if (!objectDocument) return res.status(200).json({ status: 200, error: null, data: {} })
      const formatParams = formatParamsList()

      let obisList = {}
      formatParams.indicators.map(e => uniqueShortNames(objectDocument.parameters, objectDocument.type).includes(e.param_short_name) ? obisList[e.param_short_name] = obisFilter(e.channel_full_id) : "").filter(e => e)

      const block = formatParams.indicators_block.filter(e => Object.values(obisList).includes(e.channel_full_id))
      objectDocument.params = uniqueShortNames(objectDocument.parameters, objectDocument.type)
      objectDocument.block = block
      objectDocument.obis = obisList

      const location = await repo.repositories().electObjectRepository().findLocation(id)
      res.status(200).json({ status: 200, error: null, data: objectDocument, location })
   } catch (err) {
      console.log(err)
      const error = new CustomError(err.status, err.message)
      res.status(error.status).json({ status: error.status, error: error.message, data: null })
   }
}

module.exports.factories = async (req, res) => {
   try {
      const data = await repo.repositories().electObjectRepository().factory()

      res.status(200).json({ status: 200, error: null, data })
   } catch (err) {
      const error = new CustomError(err.status, err.message)
      res.status(error.status).json({ status: error.status, error: error.message, data: null })
   }
}

module.exports.getFirstTemplate = async (req, res) => {
   try {
      const { id } = req.params
      const { date1, date2, step } = req.data

      const find = await repo.repositories().electObjectRepository().findById(id)
      if (!find) throw new CustomError(404, "Elect not found")

      const pages = await repo.repositories().electObjectRepository().firstTemplateReport(id, date1, date2, step)
      let reportData = {}
      if (pages) reportData = await sortvalueObjectsForFirstReport(pages, find._id, step, date1, date2)

      const data = {
         data: reportData,
         location: await repo.repositories().electObjectRepository().findLocation(id)
      }

      res.status(200).json({ status: 200, error: null, data })
   } catch (err) {
      const error = new CustomError(err.status, err.message)
      res.status(error.status).json({ status: error.status, error: error.message, data: null })
   }
}

module.exports.listUseMeterElectFn = async (req, res) => {
   try {
      const data = await repo.repositories().electObjectRepository().listUse()

      res.status(200).json({ status: 200, error: null, data })
   } catch (err) {
      const error = new CustomError(err.status, err.message)
      res.status(error.status).json({ status: error.status, error: error.message, data: null })
   }
}