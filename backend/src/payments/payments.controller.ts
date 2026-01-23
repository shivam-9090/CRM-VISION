import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Get all available subscription plans
   */
  @Get('plans')
  async getPlans() {
    return this.paymentsService.getPlans();
  }

  /**
   * Get specific plan details
   */
  @Get('plans/:id')
  async getPlan(@Param('id') id: string) {
    return this.paymentsService.getPlan(id);
  }

  /**
   * Create a payment order
   */
  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createOrder(@Request() req: any, @Body() body: { planId: string }) {
    return this.paymentsService.createOrder(req.user.companyId, body.planId);
  }

  /**
   * Verify payment after Razorpay callback
   */
  @Post('verify')
  async verifyPayment(
    @Body()
    verification: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.paymentsService.verifyPayment(verification);
  }

  /**
   * Get current subscription
   */
  @Get('subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscription(@Request() req: any) {
    return this.paymentsService.getSubscription(req.user.companyId);
  }

  /**
   * Cancel subscription
   */
  @Delete('subscription/:id')
  @UseGuards(JwtAuthGuard)
  async cancelSubscription(@Param('id') id: string) {
    return this.paymentsService.cancelSubscription(id);
  }
}
