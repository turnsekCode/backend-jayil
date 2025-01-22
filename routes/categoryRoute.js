import express from 'express';
import { addCategory, listCategories, removeCategory, singleCategory, updateCategory } from '../controllers/categoryController.js';
import  authUser  from '../middleware/auth.js';

const categoryRouter = express.Router();

// Route to add a new category
categoryRouter.post('/add', authUser, addCategory);

// Route to list all categories
categoryRouter.get('/list', authUser, listCategories);

// Route to remove a category
categoryRouter.delete('/remove', authUser, removeCategory);

// Route to get a single category by ID
categoryRouter.post('/single', authUser, singleCategory);

categoryRouter.put('/update', authUser, updateCategory);

export default categoryRouter;
