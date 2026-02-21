import {
  fail,
  KMsgError,
  KMsgErrorCode,
  type Result,
  type Template,
  type TemplateContext,
  type TemplateCreateInput,
  type TemplateInspectionProvider,
  type TemplateProvider,
  type TemplateUpdateInput,
} from "@k-msg/core";
import { validateTemplatePayload } from "./template-input";

function resolveTemplateInspectionProvider(
  provider: TemplateProvider,
  inspectionProvider?: TemplateInspectionProvider,
): TemplateInspectionProvider | undefined {
  if (inspectionProvider) return inspectionProvider;

  const candidate = provider as Partial<TemplateInspectionProvider>;
  if (typeof candidate.requestTemplateInspection === "function") {
    return {
      requestTemplateInspection:
        candidate.requestTemplateInspection.bind(provider),
    };
  }

  return undefined;
}

export class TemplateLifecycleService {
  private readonly inspectionProvider?: TemplateInspectionProvider;

  constructor(
    private readonly provider: TemplateProvider,
    inspectionProvider?: TemplateInspectionProvider,
  ) {
    this.inspectionProvider = resolveTemplateInspectionProvider(
      provider,
      inspectionProvider,
    );
  }

  async create(
    input: TemplateCreateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    const validation = validateTemplatePayload(input, {
      requireName: true,
      requireContent: true,
    });
    if (validation.isFailure) return validation;

    const normalizedInput: TemplateCreateInput = {
      ...input,
      ...(validation.value.name ? { name: validation.value.name } : {}),
      ...(validation.value.content
        ? { content: validation.value.content }
        : {}),
      ...(validation.value.buttons !== undefined
        ? { buttons: validation.value.buttons }
        : {}),
    };

    return this.provider.createTemplate(normalizedInput, ctx);
  }

  async update(
    code: string,
    patch: TemplateUpdateInput,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template code is required",
        ),
      );
    }

    const validation = validateTemplatePayload(patch, {
      requireName: false,
      requireContent: false,
    });
    if (validation.isFailure) return validation;

    const normalizedPatch: TemplateUpdateInput = {
      ...patch,
      ...(validation.value.name !== undefined
        ? { name: validation.value.name }
        : {}),
      ...(validation.value.content !== undefined
        ? { content: validation.value.content }
        : {}),
      ...(validation.value.buttons !== undefined
        ? { buttons: validation.value.buttons }
        : {}),
    };

    return this.provider.updateTemplate(code, normalizedPatch, ctx);
  }

  async delete(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template code is required",
        ),
      );
    }

    return this.provider.deleteTemplate(code, ctx);
  }

  async get(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<Template, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template code is required",
        ),
      );
    }

    return this.provider.getTemplate(code, ctx);
  }

  async list(
    params?: { status?: string; page?: number; limit?: number },
    ctx?: TemplateContext,
  ): Promise<Result<Template[], KMsgError>> {
    return this.provider.listTemplates(params, ctx);
  }

  async requestInspection(
    code: string,
    ctx?: TemplateContext,
  ): Promise<Result<void, KMsgError>> {
    if (!code || code.trim().length === 0) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template code is required",
        ),
      );
    }

    if (!this.inspectionProvider) {
      return fail(
        new KMsgError(
          KMsgErrorCode.INVALID_REQUEST,
          "Template inspection is not supported by this provider",
        ),
      );
    }

    return this.inspectionProvider.requestTemplateInspection(code, ctx);
  }
}
