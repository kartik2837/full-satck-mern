const stripe = require('../../config/stripe');
const orderModel = require('../../models/orderModel');
const addToCartModel = require('../../models/cartProduct')
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

async function getLineItems(lineItems) {
    let productItems = [];
    if (lineItems?.data?.length) {
        for (const item of lineItems.data) {
            const product = await stripe.products.retrieve(item.price.product);
            const productId = product.metadata.productId;
            const productData = {
                productId: productId,
                name: product.name,
                price: item.price.unit_amount / 100,
                quantity: item.quantity,
                image: product.images,



            };
            productItems.push(productData);
        }
    }
    return productItems;
}

const webhooks = async (request, response) => {
    const sig = request.headers['stripe-signature'];
    const payloadString = JSON.stringify(request.body);
    const header = stripe.webhooks.generateTestHeaderString({
        payload: payloadString,
        secret: endpointSecret,
    });

    let event;
    try {
        event = stripe.webhooks.constructEvent(payloadString, header, endpointSecret);
    } catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
            const productDetails = await getLineItems(lineItems);
            const orderDetails = {
                productDetails: productDetails,
                email: session.customer_email,
                userId: session.metadata.userId,
                paymentDetails: {
                    paymentId: session.payment_intent,
                    payment_method_type: session.payment_method_types,
                    payment_status: session.payment_status,

                },
                shipping_options: session.shipping_options.map(s => {
                    return {
                        ...s,
                        shipping_amount: s.shipping_amount / 100,
                    }
                }),
                totalAmount: session.amount_total / 100,








            };
            const order = new orderModel(orderDetails);
            const saveOrder = await order.save();
            if (saveOrder?._id) {
                const deleteCartItems = await addToCartModel.deleteMany({ userId: session.metadata.userId })
            }
            break;
        case 'charge.succeeded':
            // Handle successful charge
            console.log('Charge succeeded:', event.data.object);
            break;
        case 'payment_intent.succeeded':
            // Handle successful payment intent
            console.log('Payment Intent succeeded:', event.data.object);
            break;
        case 'payment_intent.created':
            // Handle payment intent created
            console.log('Payment Intent created:', event.data.object);
            break;
        case 'charge.updated':
            // Handle charge update
            console.log('Charge updated:', event.data.object);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    response.status(200).send();
};

module.exports = webhooks;


























































// // const stripe = require('../../config/stripe');
// // const endpointSecret = 'whsec_...'; // Your Stripe webhook secret

// // const webhooks = async (request, response) => {
// //     // Get the Stripe signature from the request headers
// //     const sig = request.headers['stripe-signature'];

// //     // Stripe requires the body to be raw, so we should handle that in the webhook middleware
// //     const payloadString = JSON.stringify(request.body);
// //     const header = stripe.webhooks.generateTestHeaderString({
// //         payload: payloadString,
// //         secret: endpointSecret,
// //     });

// //     let event;

// //     // Verify the webhook signature to ensure the request is from Stripe
// //     try {
// //         event = stripe.webhooks.constructEvent(payloadString, header, endpointSecret);
// //     } catch (err) {
// //         console.error(`Error verifying webhook: ${err.message}`);
// //         response.status(400).send(`Webhook Error: ${err.message}`);
// //         return;
// //     }

// //     // Handle the event (you can process different event types here)
// //     switch (event.type) {
// //         case 'payment_intent.succeeded':
// //             const session = event.data.object;
// //             const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
// //             console.log("lineItems", lineItems);


// //             console.log(`PaymentIntent for ${paymentIntent.amount_received} was successful!`);
// //             // Handle the payment success logic here
// //             break;
// //         case 'payment_intent.failed':
// //             const paymentFailed = event.data.object;
// //             console.log(`PaymentIntent for ${paymentFailed.amount_received} failed.`);
// //             // Handle the payment failure logic here
// //             break;
// //         // Handle other event types as needed
// //         default:
// //             console.log(`Unhandled event type ${event.type}`);
// //     }

// //     // Respond with a 200 to acknowledge receipt of the event
// //     response.status(200).send('Event received');
// // };

// // module.exports = webhooks;








// // const stripe = require('../../config/stripe');
// // const orderModel = require('../../models/orderModel');
// // const endpointSecret = 'whsec_...'; // Your Stripe webhook secret

// // async function getLIneItems(lineItems) {
// //     let ProductItems = []
// //     if (lineItems?.data?.length) {
// //         for (const item of lineItems.data) {
// //             const product = await stripe.products.retrieve(item.price.product)
// //             const productId = product.metaData.productId

// //             const productData = {
// //                 productId: productId,
// //                 name: product.name,
// //                 price: item.price.unit_amount / 100,
// //                 quantity: item.quantity,
// //                 Image: product.Image
// //             }
// //             ProductItems.push(productData)

// //         }
// //     }
// //     return ProductItems
// // }

// // const webhooks = async (request, response) => {
// //     // Get the Stripe signature from the request headers
// //     const sig = request.headers['stripe-signature'];

// //     // The body should be raw for signature verification
// //     const payloadString = JSON.stringify(request.body);
// //     const header = stripe.webhooks.generateTestHeaderString({
// //         payload: payloadString,
// //         secret: endpointSecret,
// //     });

// //     let event;

// //     // Verify the webhook signature to ensure the request is from Stripe
// //     try {
// //         event = stripe.webhooks.constructEvent(payloadString, header, endpointSecret);
// //     } catch (err) {
// //         console.error(`Error verifying webhook: ${err.message}`);
// //         response.status(400).send(`Webhook Error: ${err.message}`);
// //         return;
// //     }

// //     // Handle the event (you can process different event types here)
// //     switch (event.type) {
// //         case 'payment_intent.succeeded':
// //             const paymentIntent = event.data.object; // Get the PaymentIntent object
// //             console.log(`PaymentIntent for ${paymentIntent.amount_received} was successful!`);

// //             // If the payment was made via a Checkout Session, you can list line items
// //             if (paymentIntent.checkout_session) {
// //                 try {
// //                     const session = await stripe.checkout.sessions.retrieve(paymentIntent.checkout_session);
// //                     const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
// //                     console.log("Line Items:", lineItems);
// //                     console.log('totalAmount', session.amount_received / 100);
// //                     const productDetails = await getLIneItems(lineItems)
// //                     const orderDetails = {
// //                         productDetail: productDetails,
// //                         email: session.customer_details,
// //                         userId: session.metaData.userId,
// //                         paymentDetails: {
// //                             paymentId: session.payment_intent,
// //                             payment_method_type: session.payment_method_types,
// //                             payment_status: session.payment_status
// //                         },
// //                         shipping_options: session.shipping_options,
// //                         totalAmount: session.amount_total / 100

// //                     }
// //                     const order = new orderModel(orderDetails)
// //                     const saveOrder = await order.save()

// //                 } catch (error) {
// //                     console.error("Error retrieving session or line items:", error);
// //                 }
// //             }




// //             // Handle the payment success logic here
// //             break;

// //         case 'payment_intent.failed':
// //             const paymentFailed = event.data.object;
// //             console.log(`PaymentIntent for ${paymentFailed.amount_received} failed.`);
// //             // Handle the payment failure logic here
// //             break;

// //         // Handle other event types as needed
// //         default:
// //             console.log(`Unhandled event type ${event.type}`);
// //     }

// //     // Respond with a 200 to acknowledge receipt of the event
// //     response.status(200).send('Event received');
// // };

// // module.exports = webhooks;















// const stripe = require('../../config/stripe');
// const orderModel = require('../../models/orderModel');
// const endpointSecret = 'whsec_...'; // Your Stripe webhook secret

// // Helper function to get line items
// async function getLineItems(lineItems) {
//     let productItems = [];
//     if (lineItems?.data?.length) {
//         for (const item of lineItems.data) {
//             try {
//                 const product = await stripe.products.retrieve(item.price.product);
//                 const productId = product.metadata.productId;

//                 const productData = {
//                     productId: productId,
//                     name: product.name,
//                     price: item.price.unit_amount / 100, // Converting from cents to INR
//                     quantity: item.quantity,
//                     image: product.images[0] || '', // Handling the image property correctly
//                 };
//                 productItems.push(productData);
//             } catch (err) {
//                 console.error("Error retrieving product data: ", err);
//             }
//         }
//     }
//     return productItems;
// }

// // Webhook handler
// const webhooks = async (request, response) => {
//     const sig = request.headers['stripe-signature'];

//     const payloadString = JSON.stringify(request.body);
//     const header = stripe.webhooks.generateTestHeaderString({
//         payload: payloadString,
//         secret: endpointSecret,
//     });

//     let event;

//     // Verify the webhook signature to ensure the request is from Stripe
//     try {
//         event = stripe.webhooks.constructEvent(payloadString, header, endpointSecret);
//     } catch (err) {
//         console.error(`Error verifying webhook: ${err.message}`);
//         return response.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     // Handle the event (you can process different event types here)
//     switch (event.type) {
//         case 'payment_intent.succeeded':
//             const paymentIntent = event.data.object; // Get the PaymentIntent object
//             console.log(`PaymentIntent for ${paymentIntent.amount_received} was successful!`);

//             // If the payment was made via a Checkout Session, you can list line items
//             if (paymentIntent.checkout_session) {
//                 try {
//                     const session = await stripe.checkout.sessions.retrieve(paymentIntent.checkout_session);
//                     const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

//                     console.log("Line Items:", lineItems);
//                     console.log('Total Amount:', session.amount_received / 100); // Converting from cents to INR

//                     const productDetails = await getLineItems(lineItems);
//                     const orderDetails = {
//                         productDetail: productDetails,
//                         email: session.customer_details.email, // Ensure email is properly extracted
//                         userId: session.metadata.userId,
//                         paymentDetails: {
//                             paymentId: session.payment_intent,
//                             payment_method_type: session.payment_method_types,
//                             payment_status: session.payment_status,
//                         },
//                         shipping_options: session.shipping_options,
//                         totalAmount: session.amount_total / 100, // Converting from cents to INR
//                     };

//                     // Save the order to the database
//                     const order = new orderModel(orderDetails);
//                     await order.save(); // Save the order

//                     console.log('Order saved successfully.');
//                 } catch (error) {
//                     console.error("Error retrieving session or line items:", error);
//                 }
//             }
//             break;

//         case 'payment_intent.failed':
//             const paymentFailed = event.data.object;
//             console.log(`PaymentIntent for ${paymentFailed.amount_received} failed.`);
//             // Handle payment failure logic here (e.g., notify the user, retry logic)
//             break;

//         // Handle other event types as needed
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Respond with a 200 to acknowledge receipt of the event
//     response.status(200).send('Event received');
// };

// module.exports = webhooks;





// const stripe = require('../../config/stripe');
// const orderModel = require('../../models/orderModel')
// const endpointSecret = 'whsec_...'; // Your Stripe webhook secret

// async function getLineItems(lineItems) {
//     let productItems = [];
//     if (lineItems?.data?.length) {
//         for (const item of lineItems.data) {
//             const product = await stripe.products.retrieve(item.price.product);
//             const productId = product.metadata.productId;

//             const productData = {
//                 productId: productId,
//                 name: product.name,
//                 price: item.price.unit_amount / 100, // Converting from cents to INR
//                 quantity: item.quantity,
//                 image: product.images[0] || '', // Handling the image property correctly
//             };
//             productItems.push(productData);
//         }
//     }
//     return productItems;
// }

// const webhooks = async (request, response) => {
//     const sig = request.headers['stripe-signature'];

//     const payloadString = JSON.stringify(request.body);
//     const header = stripe.webhooks.generateTestHeaderString({
//         payload: payloadString,
//         secret: endpointSecret,
//     });

//     let event;

//     // Verify the webhook signature to ensure the request is from Stripe
//     try {
//         event = stripe.webhooks.constructEvent(payloadString, header, endpointSecret);
//     } catch (err) {
//         console.error(`Error verifying webhook: ${err.message}`);
//         response.status(400).send(`Webhook Error: ${err.message}`);
//         return;
//     }

//     // Handle the event (you can process different event types here)
//     switch (event.type) {
//         case 'payment_intent.succeeded':
//             const paymentIntent = event.data.object; // Get the PaymentIntent object
//             console.log(`PaymentIntent for ${paymentIntent.amount_received} was successful!`);

//             // If the payment was made via a Checkout Session, you can list line items
//             if (paymentIntent.checkout_session) {
//                 try {
//                     const session = await stripe.checkout.sessions.retrieve(paymentIntent.checkout_session);
//                     const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

//                     console.log("Line Items:", lineItems);
//                     console.log('Total Amount:', session.amount_received / 100); // Converting from cents to INR

//                     const productDetails = await getLineItems(lineItems);
//                     const orderDetails = {
//                         productDetail: productDetails,
//                         email: session.customer_details.email, // Ensure email is properly extracted
//                         userId: session.metadata.userId,
//                         paymentDetails: {
//                             paymentId: session.payment_intent,
//                             payment_method_type: session.payment_method_types,
//                             payment_status: session.payment_status,
//                         },
//                         shipping_options: session.shipping_options.map(s => {
//                             return {
//                                 ...s,
//                                 shipping_amount: s.shipping_amount / 100
//                             }
//                         }),
//                         totalAmount: session.amount_total / 100, // Converting from cents to INR
//                     };

//                     const order = new orderModel(orderDetails);
//                     await order.save(); // Save the order

//                     console.log('Order saved successfully.');
//                 } catch (error) {
//                     console.error("Error retrieving session or line items:", error);
//                 }
//             }
//             break;

//         case 'payment_intent.failed':
//             const paymentFailed = event.data.object;
//             console.log(`PaymentIntent for ${paymentFailed.amount_received} failed.`);
//             // Handle payment failure logic here
//             break;

//         // Handle other event types as needed
//         default:
//             console.log(`Unhandled event type ${event.type}`);
//     }

//     // Respond with a 200 to acknowledge receipt of the event
//     response.status(200).send('Event received');
// };

// module.exports = webhooks;






































































