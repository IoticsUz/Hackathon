const CustomError = require("../../utils/custom_error")
const { previousModel } = require("../../models")

module.exports.previousObjectRepository = () => {
    return Object.freeze({
        upd,
        findOne,
    })
    async function upd(_id, args) {
        try {
            await previousModel.updateOne({ _id }, args)
        } catch (error) {
            throw new CustomError(error.status, error.message)
        }
    }

    async function findOne(meter_id) {
        return await previousModel.findOne({ meter_id: meter_id })
    }
}