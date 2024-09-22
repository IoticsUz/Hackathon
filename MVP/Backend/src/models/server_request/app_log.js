const mongoose = require("mongoose")

const logSchema = new mongoose.Schema({
    status: String,
    process: String,
    process_id: String,
    date: { type: Date, index: true },
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "admins", index: true }
}, {
    timestamps: true
})

module.exports.logModel = mongoose.model("log", logSchema)