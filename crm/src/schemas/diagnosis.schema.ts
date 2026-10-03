import * as yup from 'yup';
import { TicketStatus } from '@/types';

/**
 * Validation schema for technician diagnosis and repair progression.
 */
export const diagnosisSchema = yup.object().shape({
  status: yup.mixed<TicketStatus>().required('Vui lòng chọn trạng thái tiếp theo'),
  faultCause: yup.string().required('Vui lòng nhập nguyên nhân gây lỗi phần cứng/phần mềm'),
  repairSolution: yup.string().required('Vui lòng nêu rõ phương án khắc phục'),
  estimatedCost: yup
    .number()
    .typeError('Chi phí phải là số')
    .min(0, 'Chi phí không thể âm')
    .default(0),
});

export type DiagnosisFormValues = yup.InferType<typeof diagnosisSchema>;
