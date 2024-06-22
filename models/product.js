const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({ //Id will be added automatically
    title: { //This will be kinda like sequelize
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Product', productSchema)