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
import orderRoute from './routes/orderRoute.js'

// App config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middlewares
app.use(express.json())
app.use(cors())



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
    const { cartDetails, subtotal, shippingFee, total, currency, orderNumber, shippingInfo } = req.body;

    // Crear el cuerpo del correo
    let cartHTML = `
  <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
    <thead>
      <tr>
        <th style="text-align: left; padding-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd;">Producto</th>
        <th style="text-align: left; padding-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd;">Precio</th>
        <th style="text-align: left; padding-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd;">Imagen</th>
      </tr>
    </thead>
    <tbody>
`;

    cartDetails.forEach(item => {
        cartHTML += `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px 0; font-size: 14px;">${item.name} x${item.quantity}</td>
      <td style="padding: 10px 0; font-size: 14px;">${currency} ${item.price.toFixed(2)}</td>
      <td style="padding: 10px 0; text-align: center;">
        <img style="width: 40px; height: 40px; object-fit: cover;" src="${item.image}" alt="${item.name}" />
      </td>
    </tr>
  `;
    });

    cartHTML += `
    </tbody>
  </table>
`;



    const emailContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f7fa; padding: 20px; max-width: 600px; margin: 0 auto; border-radius: 8px; border: 1px solid #e1e1e1;">
        <h2 style="color: #333333; font-size: 24px; text-align: center; margin-bottom: 20px;">Detalles del Carrito</h2>
        <h3 style="color: #333333; font-size: 24px; text-align: center; margin-bottom: 20px;">Numero de pedido: ${orderNumber}</h3>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
            Hola: ${shippingInfo.name + shippingInfo.lastName}
            <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 20px 0;">
            <div style="font-size: 16px; color: #555555; margin-bottom: 10px;">
                <strong style="font-weight: bold; color: #333333;">Dirección de envío:</strong> <span style="color: #000000;">${shippingInfo.address}, ${shippingInfo.province}</span>
            </div>
            <div style="font-size: 16px; color: #555555; margin-bottom: 10px;">
                <strong style="font-weight: bold; color: #333333;">Teléfono:</strong> <span style="color: #000000;">${shippingInfo.phone}</span>
            </div>
        </div>
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
        //console.log('Correo enviado:', info.response);
        res.status(200).send('Correo enviado exitosamente');
    });
});

app.post('/send-email-status', async (req, res) => {
    const { orderId, status, email, orderNumber } = req.body;
  
    if (!orderId || !status || !email || !orderNumber) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos.' });
    }
  
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Estado de tu pedido: ${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px; max-width: 600px; margin: auto;">
          <h2 style="color: #C15470;">¡Hola!</h2>
          <p>Queremos informarte que el estado de tu pedido <strong>${orderNumber}</strong> ha cambiado.</p>
          <p><strong>Nuevo estado:</strong> ${status}</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <p>Gracias por tu preferencia.</p>
          <footer style="margin-top: 20px; font-size: 12px; color: #888;">
            <p>Atentamente,</p>
            <p>El equipo de nuestra tienda</p>
          </footer>
        </div>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ success: true, message: 'Correo enviado con éxito.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al enviar el correo.', error });
    }
  });

// api endpoints 
app.use('/api/user', userRouter)
app.use('/api/product', productRouter)
app.use('/api/cart', cartRouter)
app.use('/api/category', categoryRouter)
app.use('/api/order', orderRoute)

app.get('/', (req, res) => {
    res.send("Api working")
})

app.listen(port, () => console.log('Servidor corriendo en puerto:' + port))