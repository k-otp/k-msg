import {
  type SenderNumber,
  type SenderNumberCategory,
  type SenderNumberCreateRequest,
  SenderNumberStatus,
} from "../../types/channel.types";

export class KakaoSenderNumberManager {
  private senderNumbers: Map<string, SenderNumber> = new Map();

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
    delete allowedUpdates.createdAt;

    const hasStatusUpdate = allowedUpdates.status !== undefined;
    const nextStatus = hasStatusUpdate
      ? allowedUpdates.status
      : senderNumber.status;
    let nextVerifiedAt = senderNumber.verifiedAt;
    const canSetVerifiedAt =
      nextStatus === SenderNumberStatus.VERIFIED ||
      senderNumber.status === SenderNumberStatus.VERIFIED ||
      (senderNumber.status === SenderNumberStatus.BLOCKED &&
        senderNumber.verifiedAt !== undefined);

    if (allowedUpdates.verifiedAt !== undefined) {
      if (!canSetVerifiedAt) {
        throw new Error(
          "verifiedAt can only be set for verified sender numbers",
        );
      }
      nextVerifiedAt = allowedUpdates.verifiedAt;
    } else if (nextStatus === SenderNumberStatus.VERIFIED) {
      nextVerifiedAt = senderNumber.verifiedAt ?? new Date();
    } else if (hasStatusUpdate && nextStatus !== SenderNumberStatus.BLOCKED) {
      nextVerifiedAt = undefined;
    }

    Object.assign(senderNumber, allowedUpdates, {
      verifiedAt: nextVerifiedAt,
      updatedAt: new Date(),
    });

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
}
