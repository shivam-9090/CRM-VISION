import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

// Razorpay types
interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

interface RazorpayPaymentVerification {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initializeRazorpay();
  }

  /**
   * Initialize Razorpay instance
   */
  private initializeRazorpay() {
    try {
      // Lazy load razorpay only if credentials are provided
      const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
      const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

      if (keyId && keySecret) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });
        this.logger.log('Razorpay initialized successfully');
      } else {
        this.logger.warn(
          'Razorpay credentials not found. Payment features will be disabled.',
        );
      }
    } catch (error) {
      this.logger.error('Failed to initialize Razorpay', error);
    }
  }

  /**
   * Get all subscription plans
   */
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Get a specific plan by ID or type
   */
  async getPlan(planId: string) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });
  }

  /**
   * Get plan by type
   */
  async getPlanByType(type: string) {
    return this.prisma.subscriptionPlan.findUnique({
      where: { type: type as any },
    });
  }

  /**
   * Create a Razorpay order for subscription
   */
  async createOrder(companyId: string, planId: string) {
    if (!this.razorpay) {
      throw new BadRequestException(
        'Payment service is not configured. Please contact support.',
      );
    }

    const plan = await this.getPlan(planId);
    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    // Check if company exists
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    try {
      // Create order in Razorpay
      const orderOptions = {
        amount: Number(plan.price) * 100, // Convert to paise
        currency: plan.currency,
        receipt: `sub_${companyId}_${Date.now()}`,
        notes: {
          companyId,
          planId,
          planName: plan.name,
        },
      };

      const razorpayOrder: RazorpayOrder =
        await this.razorpay.orders.create(orderOptions);

      // Create subscription record
      const subscription = await this.prisma.subscription.create({
        data: {
          companyId,
          planId,
          status: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
        include: { plan: true },
      });

      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: plan.price,
          currency: plan.currency,
          status: 'PENDING',
          razorpayOrderId: razorpayOrder.id,
        },
      });

      return {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        subscriptionId: subscription.id,
        paymentId: payment.id,
        key: this.configService.get<string>('RAZORPAY_KEY_ID'),
      };
    } catch (error) {
      this.logger.error('Failed to create Razorpay order', error);
      throw new BadRequestException('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment(verification: RazorpayPaymentVerification) {
    if (!this.razorpay) {
      throw new BadRequestException('Payment service is not configured');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      verification;

    // Generate signature
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Update payment status
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { subscription: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment and subscription
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
      },
    });

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    await this.prisma.subscription.update({
      where: { id: payment.subscriptionId },
      data: {
        status: 'ACTIVE',
        startDate,
        endDate,
      },
    });

    return {
      success: true,
      message: 'Payment verified successfully',
      subscriptionId: payment.subscriptionId,
    };
  }

  /**
   * Get subscription details for a company
   */
  async getSubscription(companyId: string) {
    return this.prisma.subscription.findFirst({
      where: { companyId },
      include: { plan: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Create default free subscription for new company
   */
  async createFreeSubscription(companyId: string) {
    const freePlan = await this.getPlanByType('FREE');

    if (!freePlan) {
      this.logger.warn('Free plan not found. Skipping subscription creation.');
      return null;
    }

    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 10); // 10 years for free plan

    return this.prisma.subscription.create({
      data: {
        companyId,
        planId: freePlan.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate,
      },
      include: { plan: true },
    });
  }
}
