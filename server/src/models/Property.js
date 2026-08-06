const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    property_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    property_name: {
        type: String,
        required: true,
        trim: true,
    },
    property_type: {
        type: String,
        required: true,
        enum: ['text', 'textarea', 'number', 'boolean', 'select', 'date'],
        default: 'text',
    },
    options: [{
        type: String,
        trim: true,
    }],
    order: {
        type: Number,
        default: 0,
    },
    category: {
        type: String,
        default: 'Загальне',
        trim: true,
    },
    is_active: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);