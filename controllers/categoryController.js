import categoryModel from '../models/categoryModel.js';

// Function to add a category
const addCategory = async (req, res) => {
    try {
        const { category, subCategory } = req.body;

        const newCategory = new categoryModel({ category, subCategory });
        await newCategory.save();

        res.json({ success: true, message: "Categoría añadida exitosamente", data: newCategory });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to list all categories
const listCategories = async (req, res) => {
    try {
        const categories = await categoryModel.find({});
        res.json({ success: true, categories });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to remove a category
const removeCategory = async (req, res) => {
    try {
        await categoryModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Categoría eliminada exitosamente" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to get a single category
const singleCategory = async (req, res) => {
    try {
        const { categoryId } = req.body;
        const category = await categoryModel.findById(categoryId);

        if (!category) {
            return res.status(404).json({ success: false, message: "Categoría no encontrada" });
        }

        res.json({ success: true, category });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id, category, subCategory } = req.body;

        const updatedCategory = await categoryModel.findByIdAndUpdate
            (id, { category, subCategory }, { new: true });

        res.json({ success: true, message: "Categoría actualizada exitosamente", data: updatedCategory });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}




export { addCategory, listCategories, removeCategory, singleCategory, updateCategory };
