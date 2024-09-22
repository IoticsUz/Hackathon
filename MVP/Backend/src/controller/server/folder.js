const CustomError = require("../../utils/custom_error")
const repo = require("../../repository")

module.exports.getListFolders = async (req, res) => {
    try {
        const query = req.query
        const { folders } = req
        const folderDocuments = await repo.repositories().folderObjectRepository().findAll(query, folders)

        res.status(200).json({ status: 200, error: null, data: folderDocuments })
    } catch (err) {
        const error = new CustomError(err.status, err.message)
        res.status(error.status).json({ status: error.status, error: error.message, data: null })
    }
}

module.exports.getSingleFolder = async (req, res) => {
    try {
        const { id } = req.params
        const folderDocument = await repo.repositories().folderObjectRepository().findOne(id)

        if (!folderDocument) return res.status(404).json({ status: 404, error: "Folder not found", data: null })
        res.status(200).json({ status: 200, error: null, data: folderDocument })
    } catch (err) {
        const error = new CustomError(err.status, err.message)
        res.status(error.status).json({ status: error.status, error: error.message, data: null })
    }
}

module.exports.getParentFolder = async (req, res) => {
    try {
        const folderDocument = await repo.repositories().folderObjectRepository().findParentList()

        res.status(200).json({ status: 200, error: null, data: folderDocument })
    } catch (err) {
        const error = new CustomError(err.status, err.message)
        res.status(error.status).json({ status: error.status, error: error.message, data: null })
    }
}

module.exports.folderStatus = async (req, res) => {
    try {
        const { id } = req.params
        const meters = []
        const succeed = []
        const failed = []
        const result = []

        const callback = async (id) => {
            const items = await repo.repositories().folderObjectRepository().findWithParend(id)
            for (const item of items) {
                if (item.folder_type == 'meter') meters.push(item)
                else await callback(item._id)
            }
        }
        await callback(id)

        for (const value of meters) {
            if (value && value.lastJournalData) {
                if (value.lastJournalData[0] &&
                    value.lastJournalData[0].current == 'succeed' &&
                    value.lastJournalData[0].current == 'succeed'
                ) succeed.push(1)
                else failed.push(1)

                result.push(value.lastJournalData[0])
            }
        }
        const data = {
            meters: meters.length,
            succeed: succeed.length,
            failed: failed.length,
            result: result
        }

        res.status(200).json({ status: 200, error: null, data })
    } catch (err) {
        const error = new CustomError(err.status, err.message)
        res.status(error.status).json({ status: error.status, error: error.message, data: null })
    }
}
