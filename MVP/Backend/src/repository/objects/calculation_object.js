const mongoose = require("mongoose")
const CustomError = require("../../utils/custom_error")
const { calculationObjectModel, archiveModel } = require("../../models")
const { energyarchive } = require("../../global/variable")
const { existListFN } = require("../../utils/utils_fn")

module.exports.calculationObjectRepository = () => {
    return Object.freeze({
        findById,
        findAll,
        findOne,
        firstTemplateReport,
        findOneGraphAndObjectArchive,
        findOneAndDataListArchiveFull,
        findOneAndDataListArchive,
        findOneAndDashboard,
        findLocation,
        onlyMain,
    })

    async function onlyMain() {
        try {
            return await calculationObjectModel.find({ type: "main" })
        } catch (err) {
            throw new CustomError(500, err.message)
        }
    }

    async function findById(id) {
        try {
            const objectDocuments = await calculationObjectModel.findById(id)
            return objectDocuments
        } catch (err) {
            throw new CustomError(500, err.message)
        }
    }

    async function findLocation(id) {
        try {
            const location = []
            const findTop = async (parent_object) => {
                const find = await calculationObjectModel.find({ _id: parent_object })
                for (const value of find) {
                    location.push(value.name)
                    await findTop(value.parent_object)
                }
            }

            await findTop(id)
            return location
        } catch (error) {
            throw new CustomError(error.status, error.message);
        }
    }

    async function findAll(args) {
        try {
            const pipArray = [
                {
                    $lookup: {
                        from: "calculation_objects",
                        localField: "_id",
                        foreignField: "parent_object",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "calculation_objects",
                                    localField: "_id",
                                    foreignField: "parent_object",
                                    as: "child_objects"
                                }
                            }
                        ],
                        as: "child_objects"
                    }
                },
                {
                    $unwind: {
                        path: "$parameters",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "parameters",
                        localField: "parameters.parameter_id",
                        foreignField: "_id",
                        as: "parameters.param_details"
                    }
                },
                {
                    "$group": {
                        "_id": "$_id",
                        "parameters": {
                            "$push": "$parameters"
                        },
                        "name": { $first: "$name" },
                        "type": { $first: "$type" },
                        "createdAt": { $first: "$createdAt" },
                        "updatedAt": { $first: "$updatedAt" },
                        "child_objects": { $first: "$child_objects" },
                    }
                },
                {
                    $sort: {
                        createdAt: 1
                    }
                }
            ]
            if (args.type.length && args.type !== "") {
                pipArray.unshift({
                    $match: {
                        type: { $in: args.type },
                        parent_object: null
                    }
                })
            }
            if (args.list && args.list.length !== 0) {
                pipArray.unshift({
                    $match: {
                        $expr: {
                            $in: ["$_id", args.list.map(id => new mongoose.Types.ObjectId(id))]
                        }
                    }
                });
            }

            const electObject = await calculationObjectModel.aggregate(pipArray)
            if (!electObject[0]) return []

            for (const param of electObject[0].parameters) {
                if (param.params_feeder) {
                    for (const key in param.params_feeder) {
                        if (!energyarchive.includes(key)) {
                            delete param.params_feeder[key]
                        }
                    }
                }
                if (param.params_meter) {
                    for (const key in param.params_meter) {
                        if (!energyarchive.includes(key)) {
                            delete param.params_meter[key]
                        }
                    }
                }
            }

            return electObject
        } catch (err) {
            throw new CustomError(500, err.message)
        }
    }

    async function findOne(id) {
        try {
            const pipArray = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $lookup: {
                        from: "calculation_objects",
                        localField: "_id",
                        foreignField: "parent_object",
                        pipeline: [
                            {
                                $lookup: {
                                    from: "calculation_objects",
                                    localField: "_id",
                                    foreignField: "parent_object",
                                    as: "child_objects"
                                }
                            }
                        ],
                        as: "child_objects"
                    }
                }
            ]
            const electObjectDocument = await calculationObjectModel.aggregate(pipArray)
            if (!electObjectDocument[0]) return

            for (const param of electObjectDocument[0].parameters) {
                if (param.params_feeder) {
                    for (const key in param.params_feeder) {
                        if (!energyarchive.includes(key)) {
                            delete param.params_feeder[key]
                        }
                    }
                }
                if (param.params_meter) {
                    for (const key in param.params_meter) {
                        if (!energyarchive.includes(key)) {
                            delete param.params_meter[key]
                        }
                    }
                }
            }

            for (const child of electObjectDocument[0].child_objects) {
                child.meter_id = child.child_objects[0] ? child.child_objects[0].meter_id : null
            }

            return electObjectDocument[0]
        } catch (err) {
            throw new CustomError(500, err.message)
        }
    }

    async function findOneGraphAndObjectArchive(id, query) {
        try {
            const existList = existListFN(query, energyarchive)
            const limit = Number(query.limit) || 150

            const electObjectPipelines = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $unwind: {
                        path: "$parameters",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "parameters",
                        localField: "parameters.meter",
                        foreignField: "meter",
                        as: "parameters.param_details"
                    }
                },
                {
                    $unwind: {
                        path: "$parameters.param_details",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        parameters: { $push: "$parameters" },
                        name: { $first: "$name" },
                        type: { $first: "$type" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        child_objects: { $first: "$child_objects" }
                    }
                },
                {
                    $project: {
                        parameters: {
                            $filter: {
                                input: "$parameters",
                                as: "param",
                                cond: {
                                    $in: [
                                        "$$param.param_details.param_short_name",
                                        existList
                                    ]
                                }
                            }
                        },
                        name: 1,
                        type: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        child_objects: 1
                    }
                },
            ];

            const electObjectDocument = await calculationObjectModel.aggregate(electObjectPipelines, { maxTimeMS: 50000 })
            if (!electObjectDocument[0]) return undefined

            const result = { ...electObjectDocument[0], parameters: [] }
            for (const value of electObjectDocument[0].parameters) {
                const obj = value.param_details
                const archives = await archiveModel.find({
                    parameter: obj._id,
                    date: {
                        $lte: new Date(query.date2),
                        $gte: new Date(query.date1)
                    }
                })
                    .limit(limit)
                    .sort({ date: -1 })

                result.parameters.push({ ...value, parameter_values: archives })
            }
            return result
        } catch (err) {
            throw new CustomError(err.status, err.message)
        }
    }

    async function findOneAndDataListArchive(id, query) {
        try {
            const existList = existListFN(query, energyarchive)
            const limit = Number(query.limit) || 150

            const electObjectPipelines = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $unwind: {
                        path: "$parameters",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "parameters",
                        localField: "parameters.meter",
                        foreignField: "meter",
                        as: "parameters.param_details"
                    }
                },
                {
                    $unwind: {
                        path: "$parameters.param_details",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        parameters: { $push: "$parameters" },
                        name: { $first: "$name" },
                        type: { $first: "$type" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        child_objects: { $first: "$child_objects" }
                    }
                },
                {
                    $project: {
                        parameters: {
                            $filter: {
                                input: "$parameters",
                                as: "param",
                                cond: {
                                    $in: [
                                        "$$param.param_details.param_short_name",
                                        existList
                                    ]
                                }
                            }
                        },
                        name: 1,
                        type: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        child_objects: 1
                    }
                },
            ];

            const electObjectDocument = await calculationObjectModel.aggregate(electObjectPipelines, { maxTimeMS: 50000 })
            if (!electObjectDocument[0]) return undefined

            const result = { ...electObjectDocument[0], parameters: [] }
            for (const value of electObjectDocument[0].parameters) {
                const obj = value.param_details
                const archives = await archiveModel.find({
                    parameter: obj._id,
                    date: {
                        $lte: new Date(query.date2),
                        $gte: new Date(query.date1)
                    }
                })
                    .limit(limit)
                    .sort({ date: -1 })

                result.parameters.push({ ...value, parameter_values: archives })
            }
            return result
        } catch (err) {
            throw new CustomError(err.status, err.message)
        }
    }

    async function findOneAndDataListArchiveFull(id, query) {
        try {
            const existList = existListFN(query, energyarchive)

            const electObjectPipelines = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $unwind: {
                        path: "$parameters",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "parameters",
                        localField: "parameters.meter",
                        foreignField: "meter",
                        as: "parameters.param_details"
                    }
                },
                {
                    $unwind: {
                        path: "$parameters.param_details",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        parameters: { $push: "$parameters" },
                        name: { $first: "$name" },
                        type: { $first: "$type" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        child_objects: { $first: "$child_objects" }
                    }
                },
                {
                    $project: {
                        parameters: {
                            $filter: {
                                input: "$parameters",
                                as: "param",
                                cond: {
                                    $in: [
                                        "$$param.param_details.param_short_name",
                                        existList
                                    ]
                                }
                            }
                        },
                        name: 1,
                        type: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        child_objects: 1
                    }
                },
            ];

            const electObjectDocument = await calculationObjectModel.aggregate(electObjectPipelines, { maxTimeMS: 50000 })
            if (!electObjectDocument[0]) return undefined

            const result = { ...electObjectDocument[0], parameters: [] }
            for (const value of electObjectDocument[0].parameters) {
                const obj = value.param_details
                const archives = await archiveModel.find({
                    parameter: obj._id,
                    date: {
                        $lte: new Date(query.date2),
                        $gte: new Date(query.date1)
                    }
                })
                    .sort({ date: -1 })

                result.parameters.push({ ...value, parameter_values: archives })
            }
            return result
        } catch (err) {
            throw new CustomError(err.status, err.message)
        }
    }

    async function findOneAndDashboard(id, query) {
        try {
            const existList = existListFN(query, energyarchive)
            const year = query.year ? query.year : new Date().getFullYear()
            const month = query.month ? (+query.month) - 1 : new Date().getMonth()
            const fix = 10
            const multyply = 1000000000

            const electObjectPipelines = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $unwind: {
                        path: "$parameters",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "parameters",
                        localField: "parameters.meter",
                        foreignField: "meter",
                        as: "parameters.param_details"
                    }
                },
                {
                    $unwind: {
                        path: "$parameters.param_details",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    "$group": {
                        "_id": "$_id",
                        "parameters": {
                            "$push": "$parameters"
                        },
                        "name": { $first: "$name" },
                        "type": { $first: "$type" },
                        "createdAt": { $first: "$createdAt" },
                        "updatedAt": { $first: "$updatedAt" },
                        "child_objects": { $first: "$child_objects" },
                    }
                },
                {
                    $project: {
                        parameters: {
                            $filter: {
                                input: "$parameters",
                                as: "param",
                                cond: {
                                    $in: [
                                        "$$param.param_details.param_short_name",
                                        existList
                                    ]
                                }
                            }
                        },
                        name: 1,
                        type: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        child_objects: 1
                    }
                }
            ]

            const electObjectDocument = await calculationObjectModel.aggregate(electObjectPipelines, { maxTimeMS: 50000 })
            if (!electObjectDocument[0]) return

            const yearResultMap = new Map()
            const monthResultMap = new Map()
            for (const value of electObjectDocument[0].parameters) {
                const list = await archiveModel.find({ parameter: value.param_details._id, $expr: { $eq: [{ $year: "$date" }, year] } });

                for (const archive of list) {
                    if (String(value.param_details._id) == String(archive.parameter)) {
                        const date = new Date(archive.date)
                        const yearDate = date.getFullYear() + '' + date.getMonth()
                        const monthDate = date.getFullYear() + '' + date.getMonth() + '' + date.getDate()
                        const shortName = value.param_details.param_short_name

                        if (value.params_feeder && value.params_feeder[shortName] != undefined) {
                            value.multiply.forEach(element => { archive.value *= element })
                        }

                        let sign
                        if (value.params_feeder && value.params_feeder[shortName] != undefined) {
                            sign = value.params_feeder[shortName]
                        } else if (value.params_meter && value.params_meter[shortName] != undefined) {
                            sign = value.params_meter[shortName]
                        }

                        if (yearResultMap.has(yearDate) && date.getMonth() != month) {
                            const find = yearResultMap.get(yearDate)
                            if (find[shortName]) {
                                find[shortName] += sign || sign == undefined ? archive.value : -archive.value
                                yearResultMap.set(yearDate, find)
                            } else {
                                archive.value = sign || sign == undefined ? archive.value : -archive.value
                                yearResultMap.set(yearDate, { ...find, [shortName]: archive.value })
                            }
                        } else {
                            archive.value = sign || sign == undefined ? archive.value : -archive.value
                            yearResultMap.set(yearDate, { date: { month: date.getMonth() + 1, year: date.getFullYear() }, [shortName]: archive.value })
                        }

                        if (date.getMonth() == month + 1 && date.getDate() == 1 && date.getHours() == 0 && date.getMinutes() == 0) {
                            date.setMinutes(date.getMinutes() - 30)
                        } else if (date.getMonth() == month && date.getDate() == 1 && date.getHours() == 0 && date.getMinutes() == 0) {
                            date.setMinutes(date.getMinutes() - 30)
                        }

                        if (date.getMonth() == month) {
                            const value = Number(archive.value.toFixed(fix)) * multyply
                            if (monthResultMap.has(monthDate)) {
                                const find = monthResultMap.get(monthDate)
                                if (find[shortName]) {
                                    const signValue = sign || sign == undefined ? value : -value
                                    find[shortName] = ((find[shortName] * multyply) + signValue) / multyply
                                    monthResultMap.set(monthDate, find)
                                } else {
                                    archive.value = sign || sign == undefined ? value / multyply : -value / multyply
                                    monthResultMap.set(monthDate, { ...find, [shortName]: archive.value })
                                }
                            } else {
                                archive.value = sign || sign == undefined ? value / multyply : -value / multyply
                                monthResultMap.set(monthDate, { date: { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() }, [shortName]: archive.value })
                            }
                        }
                    }
                }
            }

            const data = Object.fromEntries(monthResultMap)
            const total = {
                'energyarchive_A+': null,
                'energyarchive_A-': null,
                'energyarchive_R+': null,
                'energyarchive_R-': null
            }
            for (const key in data) {
                for (const key2 in data[key]) {
                    if (key2 == 'date' && !total.year) {
                        total.month_key = data[key][key2].month - 1
                        total.month = data[key][key2].month
                        total.year = data[key][key2].year
                    } else {
                        total[key2] = total[key2] + data[key][key2] || data[key][key2]
                    }
                }
            }
            if (total.month) {
                yearResultMap.set(total.year + '' + total.month_key, {
                    date: { month: total.month, year: total.year },
                    'energyarchive_A+': total['energyarchive_A+'],
                    'energyarchive_A-': total['energyarchive_A-'],
                    'energyarchive_R+': total['energyarchive_R+'],
                    'energyarchive_R-': total['energyarchive_R-'],
                })
            }

            const sortedData = Object.keys(data)
                .sort((a, b) => a - b)
                .reduce((obj, key) => {
                    obj[key] = data[key];
                    return obj;
                }, {});

            const dataYear = Object.fromEntries(yearResultMap)
            const monthlyDocuments = Object.keys(dataYear)
                .sort((a, b) => a - b)
                .reduce((obj, key) => {
                    obj[key] = dataYear[key];
                    return obj;
                }, {});

            return { dailyDocuments: Object.values(sortedData), monthlyDocuments: Object.values(monthlyDocuments) };
        } catch (err) {
            throw new CustomError(err.status, err.message)
        }
    }

    async function firstTemplateReport(id, date1, date2, bool) {
        try {
            const startDate = new Date(date1)
            const finishDate = new Date(date2)
            startDate.setMinutes(15)

            const existList = bool ? [energyarchive[0], energyarchive[2]] : [energyarchive[1], energyarchive[3]]
            const electObjectPipelines = [
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id)
                    }
                },
                {
                    $unwind: {
                        path: "$parameters",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "parameters",
                        localField: "parameters.meter",
                        foreignField: "meter",
                        as: "parameters.param_details"
                    }
                },
                {
                    $unwind: {
                        path: "$parameters.param_details",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        parameters: { $push: "$parameters" },
                        name: { $first: "$name" },
                        type: { $first: "$type" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        child_objects: { $first: "$child_objects" }
                    }
                },
                {
                    $project: {
                        parameters: {
                            $filter: {
                                input: "$parameters",
                                as: "param",
                                cond: {
                                    $in: [
                                        "$$param.param_details.param_short_name",
                                        existList
                                    ]
                                }
                            }
                        },
                        name: 1,
                        type: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        child_objects: 1
                    }
                },
            ];

            const electObjectDocument = await calculationObjectModel.aggregate(electObjectPipelines, { maxTimeMS: 50000 })
            if (!electObjectDocument[0]) return undefined

            const result = []
            for (const value of electObjectDocument[0].parameters) {
                const obj = value.param_details
                const archives = await archiveModel.find({
                    parameter: obj._id,
                    date: {
                        $lte: new Date(finishDate),
                        $gte: new Date(startDate)
                    }
                })

                result.push({ ...value, parameter_values: archives })
            }
            return result
        } catch (err) {
            console.log(err)
            throw new CustomError(err.status, err.message)
        }
    }
}