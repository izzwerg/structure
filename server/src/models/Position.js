const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
    treeNodeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    shortTitle: {
        type: String,
        required: true,
        trim: true,
    },
    fullTitle: {
        type: String,
        default: '',
        trim: true,
    },
    rank: {
        type: String,
        default: '',
        trim: true,
    },
    specialtyCode: {
        type: String,
        default: '',
        trim: true,
    },
    tariff: {
        type: String,
        default: '',
        trim: true,
    },
    subdivisionMark: {
        type: String,
        default: '',
        trim: true,
    },
    subdivisionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subdivision',
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('Position', positionSchema);