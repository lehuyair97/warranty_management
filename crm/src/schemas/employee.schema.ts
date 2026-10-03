import * as yup from 'yup';
import { EmployeeRole } from '@/types';

export const employeeSchema = yup.object().shape({
  username: yup
    .string()
    .required('Tên tài khoản bắt buộc')
    .min(3, 'Tên tài khoản tối thiểu 3 ký tự'),
  password: yup
    .string()
    .required('Mật khẩu bắt buộc')
    .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  fullName: yup.string().required('Họ và tên bắt buộc'),
  role: yup
    .mixed<EmployeeRole>()
    .oneOf(Object.values(EmployeeRole))
    .required('Vai trò bắt buộc'),
  phoneNumber: yup.string().nullable().transform((curr, orig) => (orig === '' ? null : curr)),
  email: yup
    .string()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .nullable()
    .email('Định dạng email không hợp lệ (VD: user@domain.com)'),
});

export type EmployeeFormValues = yup.InferType<typeof employeeSchema>;

export const updateEmployeeSchema = yup.object().shape({
  fullName: yup.string().required('Họ và tên bắt buộc'),
  role: yup
    .mixed<EmployeeRole>()
    .oneOf(Object.values(EmployeeRole))
    .required('Vai trò bắt buộc'),
  phoneNumber: yup.string().nullable().transform((curr, orig) => (orig === '' ? null : curr)),
  email: yup
    .string()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .nullable()
    .email('Định dạng email không hợp lệ (VD: user@domain.com)'),
  password: yup
    .string()
    .transform((curr, orig) => (orig === '' ? null : curr))
    .nullable()
    .test('min-length', 'Mật khẩu mới tối thiểu 6 ký tự', (val) => {
      if (!val) return true;
      return val.length >= 6;
    }),
  isActive: yup.boolean().required('Trạng thái tài khoản bắt buộc'),
});

export type UpdateEmployeeFormValues = yup.InferType<typeof updateEmployeeSchema>;
