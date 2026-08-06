const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    middleName: {
        type: String,
        default: '',
        trim: true,
    },
    treeNodeId: {
        type: String,
        default: 'none',
        trim: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    extraData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });

personSchema.index({ lastName: 1, firstName: 1, middleName: 1 });

module.exports = mongoose.model('Person', personSchema);