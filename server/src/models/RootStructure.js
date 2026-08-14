const mongoose = require('mongoose');

const rootStructureSchema = new mongoose.Schema({
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

module.exports = mongoose.model('RootStructure', rootStructureSchema);