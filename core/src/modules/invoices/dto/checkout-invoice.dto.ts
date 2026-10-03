import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PaymentMethod } from '@/common/constants';

/**
 * Data Transfer Object for processing invoice checkout and receiving payment.
 */
export class CheckoutInvoiceDto {
  @ApiProperty({
    description: 'Payment method utilized for checkout settlement',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}
