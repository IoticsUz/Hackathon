const CustomError = require("../../utils/custom_error");
const { feederModel } = require("../../models");

module.exports.feederRepository = () => {
    return Object.freeze({
        findFeeder,
    });

    async function findFeeder(feeder) {
        try {
            return await feederModel.findOne({ feeder })
        } catch (error) {
            console.log(error)
            throw new CustomError(error.status, error.message);
        }
    }
}
