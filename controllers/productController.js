
import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import multer from 'multer';

const upload = multer();

// function for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, description2, price, category, subCategory, bestSeller, destacado } = req.body;

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        // upload images to cloudinary
        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
                return result.secure_url
            })
        );

        // create new product
        const prodcutData = new productModel({
            name,
            description,
            description2,
            price: Number(price),
            image: imagesUrl,
            category,
            subCategory,
            bestSeller: bestSeller === 'true' ? true : false,
            destacado: destacado === 'true' ? true : false,
            date: Date.now()
        });
        console.log(prodcutData);
        const product = new productModel(prodcutData);
        await product.save();


        res.json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// function for list product

const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        res.json({ success: true, products });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });

    }
}

// function for remove product

const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Product removed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });

    }
}

// function for single product

const singleProduct = async (req, res) => {
    try {
        const { id } = req.params;  // Obtener el ID del producto de los parámetros de la URL
        const product = await productModel.findById(id);  // Buscar el producto por ID
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
}


const updateProduct = async (req, res) => {
    try {
        const { name, description, description2, price, category, subCategory, bestSeller, destacado } = req.body;

        // Obtener el productId desde la URL (si usas la ruta /update/:id)
        const { id } = req.params;

        // Obteniendo las imágenes de los archivos si existen
        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        // Filtrar imágenes que no sean undefined
        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

      


        // Buscar el producto por su ID
        const product = await productModel.findById(id); // Usamos el id de params

          // Subir imágenes a Cloudinary
          let imagesUrl = images.length
          ? await Promise.all(
              images.map(async (item) => {
                  let result = await cloudinary.uploader.upload(item.path, { resource_type: "image" });
                  return result.secure_url;
              })
          )
          : product.image; // Si no hay nuevas imágenes, conserva las existentes

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Actualizar los campos del producto
        product.name = name;
        product.description = description;
        product.description2 = description2;
        product.price = Number(price); // Asegurarse de que el precio sea un número
        product.category = category;
        product.subCategory = subCategory;
        product.bestSeller = bestSeller === 'true'; // Convertir el string a booleano
        product.destacado = destacado === 'true'; // Convertir el string a booleano
        product.image = imagesUrl; // Actualizamos las imágenes

        // Guardar los cambios
        await product.save();

        res.json({ success: true, message: "Product updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct };