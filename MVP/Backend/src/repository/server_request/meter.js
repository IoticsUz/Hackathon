const mongoose = require("mongoose")
const CustomError = require("../../utils/custom_error")
const { meterModel } = require("../../models")

module.exports.meterRepository = () => {
    return Object.freeze({
        findAll,
        find,
        findOne,
        findWithNumber,
        countDocuments,
        findListAlreadyPorts,
    })

    async function countDocuments(args) {
        try {
            return await meterModel.countDocuments(args)
        } catch (err) {
            throw new CustomError(500, err.message)
        }
    }

    async function find() {
        try {
            return (await meterModel.find()).filter(e => e.status)
        } catch (error) {
            throw new CustomError(error.status, error.message)
        }
    }

    async function findWithNumber(number_meter) {
        try {
            return await meterModel.findOne({ number_meter })
        } catch (error) {
            throw new CustomError(error.status, error.message)
        }
    }

    async function findAll() {
        try {
            const pipeline = [
                {
                    $lookup: {
                        from: "parameters",
                        let: { meterId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ["$meter", "$$meterId"] },
                                }
                            }
                        ],
                        as: "parameters"
                    }
                },
                {
                    $sort: { "_id": 1 }
                }
            ];

            const meterDocuments = await meterModel.aggregate(pipeline);
            return meterDocuments.filter(e => e.status);
        } catch (err) {
            console.error('findAll funktsiyasida xato:', err);
            throw new CustomError(500, err.message);
        }
    }

    async function findOne(id) {
        try {
            const meterDocuments = await meterModel.aggregate([
                {
                    $match: { _id: new mongoose.Types.ObjectId(id) }
                },
                {
                    $lookup: {
                        from: "parameters",
                        foreignField: "meter",
                        localField: "_id",
                        as: "parameters"
                    }
                }
            ])
            if (meterDocuments[0] && meterDocuments[0].status) return meterDocuments[0]
        } catch (err) {
            throw new CustomError(500, err.message)
        }
    }

    async function findListAlreadyPorts() {
        try {
            const meterDocuments = await meterModel.find({ connection_channel: { $in: ["3", "4"] }, status: true })
            return meterDocuments.map(e => e.port)
        } catch (err) {
            throw new CustomError(500, err.message)
        }
    }
}
