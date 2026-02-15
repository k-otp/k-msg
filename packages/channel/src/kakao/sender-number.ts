import {
  type SenderNumber,
  type SenderNumberCategory,
  type SenderNumberCreateRequest,
  SenderNumberStatus,
} from "../types/channel.types";

export class KakaoSenderNumberManager {
  private senderNumbers: Map<string, SenderNumber> = new Map();
  private verificationCodes: Map<string, { code: string; expiresAt: Date }> =
    new Map();

  async addSenderNumber(
    channelId: string,
    request: SenderNumberCreateRequest,
  ): Promise<SenderNumber> {
    // Validate phone number format
    this.validatePhoneNumber(request.phoneNumber);

    // Check if number is already registered
    const existingNumber = this.findSenderNumberByPhone(request.phoneNumber);
    if (existingNumber) {
      throw new Error("Phone number is already registered");
    }

    const senderNumberId = this.generateSenderNumberId();

    const senderNumber: SenderNumber = {
      id: senderNumberId,
      channelId,
      phoneNumber: request.phoneNumber,
      status: SenderNumberStatus.PENDING,
      category: request.category,
      metadata: {
        businessName: request.businessInfo?.businessName,
        businessRegistrationNumber:
          request.businessInfo?.businessRegistrationNumber,
        contactPerson: request.businessInfo?.contactPerson,
        contactEmail: request.businessInfo?.contactEmail,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.senderNumbers.set(senderNumberId, senderNumber);

    // Initiate verification process
    await this.initiateVerification(senderNumber);

    return senderNumber;
  }

  private validatePhoneNumber(phoneNumber: string): void {
    // Korean phone number validation
    const regex = /^(010|011|016|017|018|019)[0-9]{7,8}$/;
    if (!regex.test(phoneNumber)) {
      throw new Error("Invalid Korean phone number format");
    }
  }

  private findSenderNumberByPhone(
    phoneNumber: string,
  ): SenderNumber | undefined {
    return Array.from(this.senderNumbers.values()).find(
      (sn) => sn.phoneNumber === phoneNumber,
    );
  }

  private async initiateVerification(
    senderNumber: SenderNumber,
  ): Promise<void> {
    // Generate verification code
    const verificationCode = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store verification code
    this.verificationCodes.set(senderNumber.id, {
      code: verificationCode,
      expiresAt,
    });

    // Update sender number status
    senderNumber.status = SenderNumberStatus.VERIFYING;
    senderNumber.verificationCode = verificationCode;
    senderNumber.updatedAt = new Date();

    // In a real implementation, send SMS to the phone number
    // Do not console.log sensitive information in library code.

    // Simulate SMS sending
    await this.sendVerificationSMS(senderNumber.phoneNumber, verificationCode);
  }

  private async sendVerificationSMS(
    phoneNumber: string,
    code: string,
  ): Promise<void> {
    // In a real implementation, this would use an SMS provider
    void phoneNumber;
    void code;
  }

  async verifySenderNumber(
    senderNumberId: string,
    code: string,
  ): Promise<boolean> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      throw new Error("Sender number not found");
    }

    const verification = this.verificationCodes.get(senderNumberId);
    if (!verification) {
      throw new Error("No verification code found");
    }

    // Check if code is expired
    if (new Date() > verification.expiresAt) {
      throw new Error("Verification code has expired");
    }

    // Check if code matches
    if (verification.code !== code) {
      return false;
    }

    // Mark as verified
    senderNumber.status = SenderNumberStatus.VERIFIED;
    senderNumber.verifiedAt = new Date();
    senderNumber.updatedAt = new Date();
    delete senderNumber.verificationCode;

    // Clean up verification code
    this.verificationCodes.delete(senderNumberId);

    return true;
  }

  async resendVerificationCode(senderNumberId: string): Promise<void> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      throw new Error("Sender number not found");
    }

    if (senderNumber.status !== SenderNumberStatus.VERIFYING) {
      throw new Error("Sender number is not in verifying status");
    }

    // Check rate limiting (prevent spam)
    const lastVerification = this.verificationCodes.get(senderNumberId);
    if (lastVerification) {
      const timeSinceLastCode =
        Date.now() - (lastVerification.expiresAt.getTime() - 5 * 60 * 1000);
      if (timeSinceLastCode < 60 * 1000) {
        // 1 minute cooldown
        throw new Error(
          "Please wait before requesting a new verification code",
        );
      }
    }

    // Generate new verification code
    await this.initiateVerification(senderNumber);
  }

  async getSenderNumber(senderNumberId: string): Promise<SenderNumber | null> {
    return this.senderNumbers.get(senderNumberId) || null;
  }

  async listSenderNumbers(filters?: {
    channelId?: string;
    status?: SenderNumberStatus;
    category?: SenderNumberCategory;
    verified?: boolean;
  }): Promise<SenderNumber[]> {
    let senderNumbers = Array.from(this.senderNumbers.values());

    if (filters) {
      if (filters.channelId) {
        senderNumbers = senderNumbers.filter(
          (sn) => sn.channelId === filters.channelId,
        );
      }
      if (filters.status) {
        senderNumbers = senderNumbers.filter(
          (sn) => sn.status === filters.status,
        );
      }
      if (filters.category) {
        senderNumbers = senderNumbers.filter(
          (sn) => sn.category === filters.category,
        );
      }
      if (filters.verified !== undefined) {
        if (filters.verified) {
          senderNumbers = senderNumbers.filter(
            (sn) => sn.status === SenderNumberStatus.VERIFIED,
          );
        } else {
          senderNumbers = senderNumbers.filter(
            (sn) => sn.status !== SenderNumberStatus.VERIFIED,
          );
        }
      }
    }

    return senderNumbers;
  }

  async updateSenderNumber(
    senderNumberId: string,
    updates: Partial<SenderNumber>,
  ): Promise<SenderNumber> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      throw new Error("Sender number not found");
    }

    // Prevent updating certain fields
    const allowedUpdates = { ...updates };
    delete allowedUpdates.id;
    delete allowedUpdates.phoneNumber;
    delete allowedUpdates.verifiedAt;
    delete allowedUpdates.createdAt;

    Object.assign(senderNumber, allowedUpdates, { updatedAt: new Date() });

    return senderNumber;
  }

  async deleteSenderNumber(senderNumberId: string): Promise<boolean> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      return false;
    }

    // Check if sender number is being used
    if (await this.isSenderNumberInUse(senderNumberId)) {
      throw new Error("Cannot delete sender number that is currently in use");
    }

    this.senderNumbers.delete(senderNumberId);
    this.verificationCodes.delete(senderNumberId);

    return true;
  }

  private async isSenderNumberInUse(_senderNumberId: string): Promise<boolean> {
    // In a real implementation, check if any templates or active campaigns use this sender number
    return false;
  }

  async blockSenderNumber(
    senderNumberId: string,
    reason: string,
  ): Promise<void> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      throw new Error("Sender number not found");
    }

    senderNumber.status = SenderNumberStatus.BLOCKED;
    senderNumber.updatedAt = new Date();

    // In a real implementation, persist to an audit log (do not console.log in library code).
    void reason;
  }

  async unblockSenderNumber(senderNumberId: string): Promise<void> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    if (!senderNumber) {
      throw new Error("Sender number not found");
    }

    if (senderNumber.status !== SenderNumberStatus.BLOCKED) {
      throw new Error("Sender number is not blocked");
    }

    // Restore to previous status (assume verified if was blocked)
    senderNumber.status = senderNumber.verifiedAt
      ? SenderNumberStatus.VERIFIED
      : SenderNumberStatus.PENDING;
    senderNumber.updatedAt = new Date();
  }

  async validateSenderNumberForSending(senderNumberId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const senderNumber = this.senderNumbers.get(senderNumberId);
    const errors: string[] = [];

    if (!senderNumber) {
      errors.push("Sender number not found");
      return { isValid: false, errors };
    }

    if (senderNumber.status !== SenderNumberStatus.VERIFIED) {
      errors.push(
        `Sender number status is ${senderNumber.status}, must be verified`,
      );
    }

    if (!senderNumber.verifiedAt) {
      errors.push("Sender number has not been verified");
    }

    // Check if verification is recent (within 1 year)
    if (senderNumber.verifiedAt) {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      if (senderNumber.verifiedAt < oneYearAgo) {
        errors.push("Sender number verification has expired");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private generateSenderNumberId(): string {
    return `sn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Cleanup expired verification codes
  cleanup(): void {
    const now = new Date();
    for (const [id, verification] of this.verificationCodes) {
      if (now > verification.expiresAt) {
        this.verificationCodes.delete(id);

        // Reset sender number status if verification expired
        const senderNumber = this.senderNumbers.get(id);
        if (
          senderNumber &&
          senderNumber.status === SenderNumberStatus.VERIFYING
        ) {
          senderNumber.status = SenderNumberStatus.PENDING;
          delete senderNumber.verificationCode;
          senderNumber.updatedAt = new Date();
        }
      }
    }
  }
}
