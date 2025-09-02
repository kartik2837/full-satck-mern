import React, { useEffect, useState } from 'react'
import SummaryApi from '../common'
import moment from 'moment'
import displayINRCurrency from '../helpers/indianCurrency'
const OrderPage = () => {
    const [data, setData] = useState([])
    const fetchOrderDetails = async () => {
        const response = await fetch(SummaryApi.getOrder.url, {
            method: SummaryApi.getOrder.method,
            credentials: "include"
        })
        const responseData = await response.json()
        setData(responseData.data)
        console.log('order list', responseData)

    }
    useEffect(() => {
        fetchOrderDetails()
    })

    useEffect(() => {
        fetchOrderDetails()
    }, [])
    return (
        <div>
            {
                !data[0] && (
                    <p>No Order Available</p>
                )
            }
            <div className='p-4 w-full'>
                {
                    data.map((item, index) => {
                        return (
                            <div key={item.userId + index}>
                                <p className='font-semibold text-lg'>{moment(item.createdAt).format('LLL')}</p>
                                <div className='border rounded'>
                                    <div className='flex justify-between flex-col lg:flex-row'>
                                        <div className='grid gap-1 bg-blue-500'>
                                            {
                                                item?.productDetails.map((product, index) => {
                                                    return (
                                                        <div key={product.productId + index} className='flex gap-3 bg-slate-200'>
                                                            <img src={product.image[0]} className='w-28 h-28 bg-white object-scale-down p-2'
                                                            />
                                                            <div>
                                                                <div className='font-semibold text-lg text-ellipsis line-clamp-1'>{product.name} </div>
                                                                <div className='flex items-center gap-5 font-semibold mt-1'>
                                                                    <div className='text-lg text-blue-600'>{displayINRCurrency(product.price)}</div>
                                                                    <div>Quantity:{product.quantity}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            }

                                        </div>

                                        <div className='flex flex-col gap-4 p-2 min-w[320px]'>

                                            <div>

                                                <div className='text-lg font-semibold'>Payment Details: </div>
                                                <p className='text-lg font-semibold ml-1'>payment method:{item.paymentDetails.payment_method_type[0]}</p>
                                                <p className='text-lg font-semibold ml-1'>Payment Status:{item.paymentDetails.payment_status}</p>
                                                <div>
                                                    <div className='text-lg font-semibold'>Shipping Details</div>
                                                    {
                                                        item.shipping_options.map((shipping, index) => {
                                                            return (
                                                                <div key={shipping.shipping_rate} className='text-lg font-semibold ml-1'>
                                                                    Shipping Amount: {shipping.shipping_amount}
                                                                </div>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                                <div className=' text-lg font-semibold text-red-600 ml-auto w-fit'>
                                    Total Amount:{item.totalAmount}
                                </div>
                            </div>
                        )
                    })
                }
            </div>



        </div>
    )
}

export default OrderPage




