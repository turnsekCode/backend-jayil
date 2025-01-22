import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    category: {type: String, required: false},
    subCategory: {type: String, required: false},
})

const categoryModel = mongoose.models.category || mongoose.model("category", categorySchema);

export default categoryModel;