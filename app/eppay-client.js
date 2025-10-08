/**
 * EpPay Client for Shopify
 *
 * Handles communication with EpPay API
 */

const axios = require('axios');
const QRCode = require('qrcode');

class EpPayClient {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://eppay.io';
    this.defaultBeneficiary = config.defaultBeneficiary;
    this.defaultRpc = config.defaultRpc;
    this.defaultToken = config.defaultToken;

    if (!this.apiKey) {
      throw new Error('EpPay API key is required');
    }
  }

  /**
   * Generate a payment request
   */
  async generatePayment(params) {
    const to = params.to || this.defaultBeneficiary;
    const rpc = params.rpc || this.defaultRpc;
    const token = params.token || this.defaultToken;

    if (!to || !rpc || !token) {
      throw new Error('Missing required payment parameters');
    }

    try {
      const response = await axios.post(`${this.baseUrl}/generate-code`, {
        apiKey: this.apiKey,
        amount: params.amount.toString(),
        to,
        rpc,
        token,
        success: `${this.baseUrl}/payment-success`,
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('EpPay payment generation failed:', error.response?.data || error.message);
      throw new Error(`Failed to generate payment: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Verify payment status
   */
  async verifyPayment(paymentId) {
    try {
      const response = await axios.get(`${this.baseUrl}/payment-status/${paymentId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('EpPay payment verification failed:', error.response?.data || error.message);
      throw new Error(`Failed to verify payment: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Check if payment is completed
   */
  async isPaymentCompleted(paymentId) {
    try {
      const status = await this.verifyPayment(paymentId);
      return status.status === true;
    } catch (error) {
      console.error('Error checking payment status:', error.message);
      return false;
    }
  }

  /**
   * Get QR code data string
   */
  getQrCodeData(paymentId) {
    return `product=uuideppay&id=${paymentId}`;
  }

  /**
   * Get QR code as data URL
   */
  async getQrCodeUrl(paymentId, size = 300) {
    const data = this.getQrCodeData(paymentId);

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Get payment page URL
   */
  getPaymentUrl(paymentId) {
    return `${this.baseUrl}/payment/${paymentId}`;
  }
}

module.exports = EpPayClient;
