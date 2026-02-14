/**
 * Business Verification System
 * 사업자 정보 및 서류 검증 시스템
 */

import { EventEmitter } from "events";
import {
  Channel,
  DocumentStatus,
  DocumentType,
  type VerificationDocument,
  VerificationStatus,
} from "../types/channel.types";

export interface BusinessInfo {
  businessName: string;
  businessRegistrationNumber: string;
  businessType: "corporation" | "individual" | "partnership" | "other";
  industry: string;
  establishedDate: Date;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  contactInfo: {
    phoneNumber: string;
    email: string;
    website?: string;
  };
  representatives: Array<{
    name: string;
    position: string;
    phoneNumber: string;
    email: string;
  }>;
}

export interface VerificationRequest {
  id: string;
  channelId: string;
  businessInfo: BusinessInfo;
  documents: VerificationDocument[];
  status: VerificationStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  autoVerificationResults?: AutoVerificationResult[];
}

export interface AutoVerificationResult {
  checkType:
    | "business_registry"
    | "document_validation"
    | "address_verification"
    | "phone_verification";
  status: "passed" | "failed" | "warning";
  score: number; // 0-100
  details: string;
  metadata?: Record<string, any>;
}

export interface DocumentValidationResult {
  isValid: boolean;
  confidence: number; // 0-100
  extractedData?: Record<string, any>;
  issues: Array<{
    type: "format" | "content" | "quality" | "authenticity";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
  }>;
}

export interface BusinessVerifierOptions {
  enableAutoVerification: boolean;
  requiredDocuments: DocumentType[];
  autoApprovalThreshold: number; // 0-100
  requireManualReview: boolean;
  documentRetentionDays: number;
  enableExternalAPIs: boolean;
  externalAPIConfig?: {
    businessRegistryAPI?: string;
    addressVerificationAPI?: string;
    documentOCRAPI?: string;
  };
}

export class BusinessVerifier extends EventEmitter {
  private verificationRequests = new Map<string, VerificationRequest>();
  private documentValidators = new Map<
    DocumentType,
    (doc: VerificationDocument) => Promise<DocumentValidationResult>
  >();

  private defaultOptions: BusinessVerifierOptions = {
    enableAutoVerification: true,
    requiredDocuments: [DocumentType.BUSINESS_REGISTRATION],
    autoApprovalThreshold: 80,
    requireManualReview: false,
    documentRetentionDays: 365,
    enableExternalAPIs: false,
  };

  constructor(private options: Partial<BusinessVerifierOptions> = {}) {
    super();
    this.options = { ...this.defaultOptions, ...options };
    this.initializeDocumentValidators();
  }

  /**
   * Submit business verification request
   */
  async submitVerification(
    channelId: string,
    businessInfo: BusinessInfo,
    documents: VerificationDocument[],
  ): Promise<VerificationRequest> {
    const requestId = this.generateRequestId();

    // Validate required documents
    this.validateRequiredDocuments(documents);

    const verificationRequest: VerificationRequest = {
      id: requestId,
      channelId,
      businessInfo,
      documents: documents.map((doc) => ({
        ...doc,
        status: DocumentStatus.UPLOADED,
      })),
      status: VerificationStatus.PENDING,
      submittedAt: new Date(),
    };

    this.verificationRequests.set(requestId, verificationRequest);

    this.emit("verification:submitted", { verificationRequest });

    // Start verification process
    if (this.options.enableAutoVerification) {
      await this.processAutoVerification(requestId);
    }

    return verificationRequest;
  }

  /**
   * Get verification request by ID
   */
  getVerificationRequest(requestId: string): VerificationRequest | null {
    return this.verificationRequests.get(requestId) || null;
  }

  /**
   * Get verification request by channel ID
   */
  getVerificationByChannelId(channelId: string): VerificationRequest | null {
    for (const request of this.verificationRequests.values()) {
      if (request.channelId === channelId) {
        return request;
      }
    }
    return null;
  }

  /**
   * Manually approve verification
   */
  async approveVerification(
    requestId: string,
    reviewerId: string,
    notes?: string,
  ): Promise<VerificationRequest> {
    const request = this.verificationRequests.get(requestId);
    if (!request) {
      throw new Error("Verification request not found");
    }

    request.status = VerificationStatus.VERIFIED;
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;
    request.reviewNotes = notes;

    // Mark all documents as verified
    request.documents.forEach((doc) => {
      doc.status = DocumentStatus.VERIFIED;
    });

    this.emit("verification:approved", {
      verificationRequest: request,
      reviewerId,
    });

    return request;
  }

  /**
   * Manually reject verification
   */
  async rejectVerification(
    requestId: string,
    reviewerId: string,
    reason: string,
  ): Promise<VerificationRequest> {
    const request = this.verificationRequests.get(requestId);
    if (!request) {
      throw new Error("Verification request not found");
    }

    request.status = VerificationStatus.REJECTED;
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;
    request.reviewNotes = reason;

    // Mark problematic documents as rejected
    request.documents.forEach((doc) => {
      if (doc.status === DocumentStatus.UPLOADED) {
        doc.status = DocumentStatus.REJECTED;
      }
    });

    this.emit("verification:rejected", {
      verificationRequest: request,
      reviewerId,
      reason,
    });

    return request;
  }

  /**
   * Update verification request with additional documents
   */
  async addDocument(
    requestId: string,
    document: VerificationDocument,
  ): Promise<VerificationRequest> {
    const request = this.verificationRequests.get(requestId);
    if (!request) {
      throw new Error("Verification request not found");
    }

    if (
      request.status !== VerificationStatus.PENDING &&
      request.status !== VerificationStatus.UNDER_REVIEW
    ) {
      throw new Error("Cannot add documents to completed verification");
    }

    document.status = DocumentStatus.UPLOADED;
    request.documents.push(document);

    // If auto verification is enabled, re-process
    if (this.options.enableAutoVerification) {
      await this.processAutoVerification(requestId);
    }

    this.emit("verification:document_added", {
      verificationRequest: request,
      document,
    });

    return request;
  }

  /**
   * List verification requests with filters
   */
  listVerificationRequests(filters?: {
    status?: VerificationStatus;
    channelId?: string;
    submittedAfter?: Date;
    submittedBefore?: Date;
  }): VerificationRequest[] {
    let requests = Array.from(this.verificationRequests.values());

    if (filters?.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }
    if (filters?.channelId) {
      requests = requests.filter((r) => r.channelId === filters.channelId);
    }
    if (filters?.submittedAfter) {
      requests = requests.filter(
        (r) => r.submittedAt >= filters.submittedAfter!,
      );
    }
    if (filters?.submittedBefore) {
      requests = requests.filter(
        (r) => r.submittedAt <= filters.submittedBefore!,
      );
    }

    return requests.sort(
      (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime(),
    );
  }

  /**
   * Get verification statistics
   */
  getVerificationStats(): {
    total: number;
    byStatus: Record<string, number>;
    averageProcessingTime: number;
    autoApprovalRate: number;
  } {
    const requests = Array.from(this.verificationRequests.values());

    const byStatus: Record<string, number> = {};
    let totalProcessingTime = 0;
    let processedCount = 0;
    let autoApprovedCount = 0;

    requests.forEach((request) => {
      byStatus[request.status] = (byStatus[request.status] || 0) + 1;

      if (request.reviewedAt) {
        const processingTime =
          request.reviewedAt.getTime() - request.submittedAt.getTime();
        totalProcessingTime += processingTime;
        processedCount++;

        // Check if it was auto-approved (no manual reviewer)
        if (
          !request.reviewedBy &&
          request.status === VerificationStatus.VERIFIED
        ) {
          autoApprovedCount++;
        }
      }
    });

    return {
      total: requests.length,
      byStatus,
      averageProcessingTime:
        processedCount > 0 ? totalProcessingTime / processedCount : 0,
      autoApprovalRate:
        processedCount > 0 ? (autoApprovedCount / processedCount) * 100 : 0,
    };
  }

  // Private Methods
  private async processAutoVerification(requestId: string): Promise<void> {
    const request = this.verificationRequests.get(requestId);
    if (!request) return;

    request.status = VerificationStatus.UNDER_REVIEW;
    this.emit("verification:auto_processing_started", {
      verificationRequest: request,
    });

    const autoResults: AutoVerificationResult[] = [];

    try {
      // 1. Validate business registration
      const businessCheck = await this.verifyBusinessRegistration(
        request.businessInfo,
      );
      autoResults.push(businessCheck);

      // 2. Validate documents
      for (const document of request.documents) {
        const docValidation = await this.validateDocument(document);
        autoResults.push({
          checkType: "document_validation",
          status: docValidation.isValid ? "passed" : "failed",
          score: docValidation.confidence,
          details: `Document validation: ${docValidation.issues.length} issues found`,
          metadata: { documentId: document.id, issues: docValidation.issues },
        });
      }

      // 3. Verify address
      const addressCheck = await this.verifyAddress(
        request.businessInfo.address,
      );
      autoResults.push(addressCheck);

      // 4. Verify phone number
      const phoneCheck = await this.verifyPhoneNumber(
        request.businessInfo.contactInfo.phoneNumber,
      );
      autoResults.push(phoneCheck);

      request.autoVerificationResults = autoResults;

      // Calculate overall score
      const overallScore =
        autoResults.reduce((sum, result) => sum + result.score, 0) /
        autoResults.length;

      // Auto-approve if score is high enough
      if (
        overallScore >= this.options.autoApprovalThreshold! &&
        !this.options.requireManualReview
      ) {
        request.status = VerificationStatus.VERIFIED;
        request.reviewedAt = new Date();
        request.reviewNotes = `Auto-approved with score: ${overallScore.toFixed(1)}`;

        // Mark documents as verified
        request.documents.forEach((doc) => {
          doc.status = DocumentStatus.VERIFIED;
        });

        this.emit("verification:auto_approved", {
          verificationRequest: request,
          score: overallScore,
        });
      } else {
        // Requires manual review
        this.emit("verification:manual_review_required", {
          verificationRequest: request,
          score: overallScore,
        });
      }
    } catch (error) {
      request.status = VerificationStatus.PENDING;
      this.emit("verification:auto_processing_failed", {
        verificationRequest: request,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  private validateRequiredDocuments(documents: VerificationDocument[]): void {
    const providedTypes = new Set(documents.map((doc) => doc.type));
    const missingTypes = this.options.requiredDocuments!.filter(
      (type) => !providedTypes.has(type),
    );

    if (missingTypes.length > 0) {
      throw new Error(`Missing required documents: ${missingTypes.join(", ")}`);
    }
  }

  private async verifyBusinessRegistration(
    businessInfo: BusinessInfo,
  ): Promise<AutoVerificationResult> {
    // In a real implementation, this would call external business registry APIs
    // For demo purposes, we'll simulate the verification

    const score = this.calculateBusinessRegistrationScore(businessInfo);

    return {
      checkType: "business_registry",
      status: score >= 70 ? "passed" : score >= 50 ? "warning" : "failed",
      score,
      details: `Business registration verification completed`,
      metadata: {
        businessName: businessInfo.businessName,
        registrationNumber: businessInfo.businessRegistrationNumber,
      },
    };
  }

  private calculateBusinessRegistrationScore(
    businessInfo: BusinessInfo,
  ): number {
    let score = 0;

    // Check business registration number format (Korean format)
    if (/^\d{3}-\d{2}-\d{5}$/.test(businessInfo.businessRegistrationNumber)) {
      score += 30;
    }

    // Check if business name is reasonable
    if (
      businessInfo.businessName.length >= 2 &&
      businessInfo.businessName.length <= 100
    ) {
      score += 20;
    }

    // Check if established date is reasonable
    const now = new Date();
    const establishedDate = new Date(businessInfo.establishedDate);
    const yearsOld =
      (now.getTime() - establishedDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    if (yearsOld >= 0 && yearsOld <= 100) {
      score += 20;
    }

    // Check contact information completeness
    if (
      businessInfo.contactInfo.email &&
      businessInfo.contactInfo.phoneNumber
    ) {
      score += 15;
    }

    // Check address completeness
    if (
      businessInfo.address.street &&
      businessInfo.address.city &&
      businessInfo.address.postalCode
    ) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private async validateDocument(
    document: VerificationDocument,
  ): Promise<DocumentValidationResult> {
    const validator = this.documentValidators.get(document.type);
    if (!validator) {
      return {
        isValid: false,
        confidence: 0,
        issues: [
          {
            type: "format",
            severity: "critical",
            message: `No validator available for document type: ${document.type}`,
          },
        ],
      };
    }

    return await validator(document);
  }

  private async verifyAddress(
    address: BusinessInfo["address"],
  ): Promise<AutoVerificationResult> {
    // Simulate address verification
    let score = 0;

    if (address.street && address.city && address.postalCode) {
      score += 40;
    }

    // Check postal code format (Korean format)
    if (/^\d{5}$/.test(address.postalCode)) {
      score += 30;
    }

    if (address.country === "KR" || address.country === "Korea") {
      score += 30;
    }

    return {
      checkType: "address_verification",
      status: score >= 70 ? "passed" : score >= 50 ? "warning" : "failed",
      score,
      details: "Address verification completed",
      metadata: { address },
    };
  }

  private async verifyPhoneNumber(
    phoneNumber: string,
  ): Promise<AutoVerificationResult> {
    // Korean phone number validation
    const isValidFormat = /^(010|011|016|017|018|019)[0-9]{7,8}$/.test(
      phoneNumber,
    );

    const score = isValidFormat ? 100 : 0;

    return {
      checkType: "phone_verification",
      status: isValidFormat ? "passed" : "failed",
      score,
      details: isValidFormat
        ? "Phone number format is valid"
        : "Invalid phone number format",
      metadata: { phoneNumber },
    };
  }

  private initializeDocumentValidators(): void {
    // Business Registration Document Validator
    this.documentValidators.set(
      DocumentType.BUSINESS_REGISTRATION,
      async (doc) => {
        const issues: DocumentValidationResult["issues"] = [];
        let confidence = 80; // Base confidence

        // Check file extension
        if (!doc.fileName.match(/\.(pdf|jpg|jpeg|png)$/i)) {
          issues.push({
            type: "format",
            severity: "medium",
            message: "Unsupported file format",
          });
          confidence -= 20;
        }

        // In a real implementation, would use OCR to extract and validate content

        return {
          isValid:
            issues.length === 0 ||
            issues.every((i) => i.severity !== "critical"),
          confidence: Math.max(0, confidence),
          issues,
        };
      },
    );

    // Business License Document Validator
    this.documentValidators.set(DocumentType.BUSINESS_LICENSE, async (doc) => {
      const issues: DocumentValidationResult["issues"] = [];
      let confidence = 75;

      if (!doc.fileName.match(/\.(pdf|jpg|jpeg|png)$/i)) {
        issues.push({
          type: "format",
          severity: "medium",
          message: "Unsupported file format",
        });
        confidence -= 15;
      }

      return {
        isValid:
          issues.length === 0 || issues.every((i) => i.severity !== "critical"),
        confidence: Math.max(0, confidence),
        issues,
      };
    });

    // ID Card Document Validator
    this.documentValidators.set(DocumentType.ID_CARD, async (doc) => {
      const issues: DocumentValidationResult["issues"] = [];
      let confidence = 70;

      if (!doc.fileName.match(/\.(jpg|jpeg|png)$/i)) {
        issues.push({
          type: "format",
          severity: "high",
          message: "ID card should be an image file",
        });
        confidence -= 30;
      }

      return {
        isValid:
          issues.length === 0 || issues.every((i) => i.severity !== "critical"),
        confidence: Math.max(0, confidence),
        issues,
      };
    });

    // Default validator for other document types
    const defaultValidator = async (
      doc: VerificationDocument,
    ): Promise<DocumentValidationResult> => {
      const issues: DocumentValidationResult["issues"] = [];
      let confidence = 60; // Lower confidence for unknown document types

      if (!doc.fileName || doc.fileName.length === 0) {
        issues.push({
          type: "format",
          severity: "critical",
          message: "File name is required",
        });
        confidence = 0;
      }

      return {
        isValid:
          issues.length === 0 || issues.every((i) => i.severity !== "critical"),
        confidence: Math.max(0, confidence),
        issues,
      };
    };

    this.documentValidators.set(
      DocumentType.AUTHORIZATION_LETTER,
      defaultValidator,
    );
    this.documentValidators.set(DocumentType.OTHER, defaultValidator);
  }

  private generateRequestId(): string {
    return `biz_verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
