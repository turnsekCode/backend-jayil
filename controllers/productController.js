
import { v2 as cloudinary } from 'cloudinary';
import productModel from '../models/productModel.js';
import multer from 'multer';

const upload = multer();

// function for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, description2, price, category, subCategory, bestSeller, destacado, slug, metaDescription, metaTitle, quantity } = req.body;

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
            slug,
            metaDescription, 
            metaTitle, 
            quantity,
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

const removeProduct2 = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id);
        res.json({ success: true, message: "Product removed successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });

    }
}
const removeProduct = async (req, res) => {
    try {
        // Buscar el producto por su ID
        const product = await productModel.findById(req.body.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Eliminar imágenes de Cloudinary
        if (product.image && product.image.length) {
            await Promise.all(
                product.image.map(async (imageUrl) => {
                    // Extraer public_id de la URL de Cloudinary
                    const publicId = imageUrl.split('/').pop().split('.')[0]; // Obtener el public_id de la URL
                    await cloudinary.uploader.destroy(publicId); // Eliminar usando el public_id
                })
            );
        }

        // Eliminar el producto de la base de datos
        await productModel.findByIdAndDelete(req.body.id);

        res.json({ success: true, message: "Product removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};



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
      const { name, description, description2, price, category, subCategory, bestSeller, destacado, slug, metaDescription, metaTitle, quantity } = req.body;
      const { id } = req.params; // ID del producto desde la URL
  
      // Obtener las imágenes subidas
      const image1 = req.files?.image1 && req.files.image1[0];
      const image2 = req.files?.image2 && req.files.image2[0];
      const image3 = req.files?.image3 && req.files.image3[0];
      const image4 = req.files?.image4 && req.files.image4[0];
  
      const newImages = [image1, image2, image3, image4]; // Todas las nuevas imágenes, incluidas las undefined
  
      // Buscar el producto existente
      const product = await productModel.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
  
      // Lista de imágenes actuales del producto
      const existingImages = [...product.image];
  
      // Preparar nuevas URLs para las imágenes actualizadas
      let updatedImages = [...existingImages]; // Iniciar con las imágenes existentes
  
      // Subir nuevas imágenes y eliminar las correspondientes existentes
      for (let i = 0; i < newImages.length; i++) {
        if (newImages[i]) {
          // Si hay una nueva imagen, eliminar la antigua en el índice actual
          if (existingImages[i]) {
            const publicId = existingImages[i].split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId); // Eliminar de Cloudinary
          }
  
          // Subir la nueva imagen
          const result = await cloudinary.uploader.upload(newImages[i].path, { resource_type: "image" });
          updatedImages[i] = result.secure_url; // Guardar la URL de la nueva imagen
        }
      }
  
      // Si se subieron nuevas imágenes, eliminar las sobrantes
      if (newImages.some((img) => img)) {
        const firstNewImageIndex = newImages.findIndex((img) => img); // Encontrar el primer índice de imagen nueva
        updatedImages = updatedImages.slice(0, firstNewImageIndex + newImages.filter((img) => img).length);
  
        // Eliminar imágenes sobrantes de Cloudinary
        for (let i = updatedImages.length; i < existingImages.length; i++) {
          const publicId = existingImages[i].split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId); // Eliminar de Cloudinary
        }
      }
  
      // Filtrar cualquier slot vacío en el array de imágenes final
      updatedImages = updatedImages.filter((url) => url);
  
      // Actualizar los campos del producto
      product.name = name;
      product.description = description;
      product.description2 = description2;
      product.price = Number(price); // Asegurarse de que el precio sea un número
      product.category = category;
      product.subCategory = subCategory;
      product.bestSeller = bestSeller === 'true'; // Convertir el string a booleano
      product.destacado = destacado === 'true'; // Convertir el string a booleano
      product.slug = slug;
      product.metaDescription = metaDescription;
      product.metaTitle = metaTitle;
      product.quantity = quantity;
  
      // Solo actualizar las imágenes si se detectaron cambios
      if (updatedImages.toString() !== existingImages.toString()) {
        product.image = updatedImages; // Actualizar imágenes
      }
  
      // Guardar los cambios en la base de datos
      await product.save();
  
      res.json({ success: true, message: "Product updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
  
  
  
  
  
  
  

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct };