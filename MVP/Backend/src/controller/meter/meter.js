const repo = require("../../repository/index")
const CustomError = require("../../utils/custom_error")

module.exports.getListMeter = async (req, res) => {
    try {
        const meterList = await repo.repositories().meterRepository().findAll({})
        res.status(200).json({ status: 200, error: null, data: meterList })
    } catch (err) {
        const error = new CustomError(err.status, err.message)
        res.status(error.status).json({ status: error.status, error: error.message, data: null })
    }
}

module.exports.getOneMeter = async (req, res) => {
    try {
        const { id } = req.params
        const meterDocument = await repo.repositories().meterRepository().findOne(id)
        res.status(200).json({ status: 200, error: null, data: meterDocument })
    } catch (err) {
        const error = new CustomError(err.status, err.message)
        res.status(error.status).json({ status: error.status, error: error.message, data: null })
    }
}

module.exports.meterList = async (req, res) => {
    try {
        res.status(200).json({ status: 200, error: null, data: {} })
    } catch (err) {
        const error = new CustomError(err.status, err.message)
        res.status(error.status).json({ status: error.status, error: error.message, data: null })
    }
}
