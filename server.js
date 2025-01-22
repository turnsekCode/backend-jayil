import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import nodemailer from 'nodemailer';
import categoryRouter from './routes/categoryRoute.js'

// App config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middlewares
app.use(express.json())
const corsOptions = {
    origin: 'https://frontend-jayil.vercel.app', // Cambia por el dominio permitido
    methods: ['GET', 'POST'], // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
};

app.use(cors(corsOptions));



// Configuración de Nodemailer (reemplaza con tus credenciales)
const transporter = nodemailer.createTransport({
    service: 'gmail', // Usa el servicio que prefieras
    auth: {
        user: 'pixel.tech.t@gmail.com', // Reemplaza con tu correo
        pass: 'uifc sttc klfd qlqq', // Reemplaza con tu contraseña
    },
});
// Ruta para enviar el correo
app.post('/send-email', (req, res) => {
    const { cartDetails, subtotal, shippingFee, total, currency, orderNumber } = req.body;

    // Crear el cuerpo del correo
    let cartHTML = '';
    cartDetails.forEach(item => {
        cartHTML += `<p>${item.name} x${item.quantity} - ${currency} ${item.price}</p>`;
    });

    const emailContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #e1e1e1;">
        <h2 style="color: #333333; font-size: 24px; text-align: center; margin-bottom: 20px;">Detalles del Carrito</h2>
        <h3 style="color: #333333; font-size: 24px; text-align: center; margin-bottom: 20px;">Numero de pedido: ${orderNumber}</h3>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            ${cartHTML}
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <div style="font-size: 16px; color: #555555; margin-bottom: 10px;">
                <strong style="font-weight: bold; color: #333333;">Subtotal:</strong> <span style="color: #000000;">${currency} ${subtotal.toFixed(2)}</span>
            </div>
            <div style="font-size: 16px; color: #555555; margin-bottom: 10px;">
                <strong style="font-weight: bold; color: #333333;">Shipping Fee:</strong> <span style="color: #000000;">${shippingFee}</span>
            </div>
            <div style="font-size: 18px; color: #333333; font-weight: bold; margin-top: 20px;">
                <strong>Total:</strong> <span style="color: #e53935;">${currency} ${total.toFixed(2)}</span>
            </div>
        </div>
    </div>
`;


    // Configuración del correo
    const mailOptions = {
        from: 'pixel.tech.t@gmail.com',
        to: 'pixel.tech.t@gmail.com', // Correo del destinatario
        subject: 'Detalles del Carrito',
        html: emailContent,
    };

    // Enviar correo
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
            return res.status(500).send('Error al enviar el correo');
        }
        console.log('Correo enviado:', info.response);
        res.status(200).send('Correo enviado exitosamente');
    });
});

// api endpoints 
app.use('api/user', userRouter)
app.use('api/product', productRouter)
app.use('api/cart', cartRouter)
app.use('api/category', categoryRouter)

app.get('/', (req,res)=>{
    res.send("Api working")
})

app.listen(port, ()=> console.log('Servidor corriendo en puerto:' + port))