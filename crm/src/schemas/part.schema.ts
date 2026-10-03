import * as yup from 'yup';

export const partSchema = yup.object().shape({
  partName: yup.string().required('Tên linh kiện bắt buộc'),
  partCode: yup.string().required('Mã linh kiện bắt buộc'),
  stockQuantity: yup
    .number()
    .typeError('Số lượng phải là số')
    .min(0, 'Số lượng không thể âm')
    .required('Số lượng tồn bắt buộc'),
  price: yup
    .number()
    .typeError('Đơn giá phải là số')
    .min(0, 'Đơn giá không thể âm')
    .required('Đơn giá bắt buộc'),
  unit: yup.string().default('Cái'),
});

export type PartFormValues = yup.InferType<typeof partSchema>;

export const updatePartSchema = yup.object().shape({
  partName: yup.string().required('Tên linh kiện bắt buộc'),
  unit: yup.string().required('Đơn vị tính bắt buộc'),
  price: yup
    .number()
    .typeError('Đơn giá phải là số')
    .min(0, 'Đơn giá không thể âm')
    .required('Đơn giá bắt buộc'),
  stockQuantity: yup
    .number()
    .typeError('Số lượng phải là số')
    .min(0, 'Số lượng tồn không thể âm')
    .required('Số lượng tồn bắt buộc'),
});

export type UpdatePartFormValues = yup.InferType<typeof updatePartSchema>;
