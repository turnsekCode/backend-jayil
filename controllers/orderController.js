import orderModel from '../models/orderModel.js'

// placing orders using COD metodo

const placeOrder = async (req,res) => {

    try {
        const {items, amount, address, orderNumber} = req.body;

        const orderData = {
            items,
            address,
            orderNumber,
            amount, 
            paymentMethod: 'COD',
            payment: false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        res.json({success:true,message:"Order placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}


// placing orders using stripe metodo

const placeOrderStripe = async (req,res) => {

}

// All orders using to admin panel

const allOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({})
        res.json({success:true,orders})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// User orders data for frontend

const userOrders = async (req,res) => {

}

// update order status for admin panel 

const updateStatus = async (req,res) => {

}

export {placeOrder,placeOrderStripe,allOrders,userOrders,updateStatus}