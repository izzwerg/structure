const mongoose = require('mongoose');

const subdivisionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    fullTitle: {
        type: String,
        required: true,
        trim: true,
    },
    shortTitle: {
        type: String,
        required: true,
        trim: true,
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subdivision',
        default: null,
    },
    items: [{
        kind: {
            type: String,
            enum: ['position', 'subdivision'],
            required: true,
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
    }],
}, { timestamps: true });

module.exports = mongoose.model('Subdivision', subdivisionSchema);