import * as yup from 'yup';
import { PaymentMethod } from '@/types';

/**
 * Validation schema for cashier invoice settlement checkout.
 */
export const checkoutSchema = yup.object().shape({
  paymentMethod: yup
    .mixed<PaymentMethod>()
    .oneOf(Object.values(PaymentMethod))
    .required('Vui lòng chọn hình thức thanh toán'),
});

export type CheckoutFormValues = yup.InferType<typeof checkoutSchema>;
