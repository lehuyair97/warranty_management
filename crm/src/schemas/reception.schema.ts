import * as yup from 'yup';

/**
 * Validation schema for reception POS device check-in form.
 */
export const receptionSchema = yup.object().shape({
  customerPhone: yup
    .string()
    .required('Vui lòng nhập số điện thoại khách hàng')
    .matches(/^(0[3|5|7|8|9])[0-9]{8}$/, 'Số điện thoại không đúng định dạng Việt Nam'),
  customerName: yup
    .string()
    .required('Vui lòng nhập họ và tên khách hàng')
    .min(2, 'Tên quá ngắn'),
  customerEmail: yup.string().email('Email không hợp lệ').nullable(),
  customerAddress: yup.string().nullable(),

  deviceName: yup.string().required('Vui lòng nhập tên thiết bị (VD: MacBook Air M2)'),
  deviceType: yup.string().nullable(),
  brand: yup.string().nullable(),
  serialNumber: yup.string().nullable(),
  isUnderWarranty: yup.boolean().default(false),
  warrantyExpiryDate: yup.string().nullable(),

  issueDescription: yup
    .string()
    .required('Vui lòng mô tả hiện trạng hư hỏng của máy')
    .min(5, 'Mô tả quá ngắn'),
  initialCondition: yup.string().nullable(),
  accessories: yup.string().nullable(),
  ticketType: yup
    .string()
    .oneOf(['repair', 'warranty', 're_repair'])
    .default('repair'),
});

export type ReceptionFormValues = yup.InferType<typeof receptionSchema>;
