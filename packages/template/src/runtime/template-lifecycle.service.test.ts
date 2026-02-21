import { describe, expect, it, mock } from "bun:test";
import {
  KMsgErrorCode,
  ok,
  type Template,
  type TemplateInspectionProvider,
  type TemplateProvider,
} from "@k-msg/core";
import { TemplateLifecycleService } from "./template-lifecycle.service";

describe("TemplateLifecycleService", () => {
  const mockTemplate: Template = {
    id: "tpl_123",
    code: "WELCOME_001",
    name: "Welcome Template",
    content: "Hello, #{name}!",
    category: "NOTIFICATION",
    status: "APPROVED",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProvider: TemplateProvider = {
    createTemplate: mock(async () => ok(mockTemplate)),
    updateTemplate: mock(async () => ok(mockTemplate)),
    deleteTemplate: mock(async () => ok(undefined)),
    getTemplate: mock(async () => ok(mockTemplate)),
    listTemplates: mock(async () => ok([mockTemplate])),
  };

  const mockInspectionProvider: TemplateInspectionProvider = {
    requestTemplateInspection: mock(async () => ok(undefined)),
  };

  const service = new TemplateLifecycleService(
    mockProvider,
    mockInspectionProvider,
  );

  it("creates template after payload validation", async () => {
    const result = await service.create({
      name: "Welcome Template",
      content: "Hello, #{name}!",
      category: "NOTIFICATION",
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual(mockTemplate);
    }
    expect(mockProvider.createTemplate).toHaveBeenCalled();
  });

  it("fails create when required fields are missing", async () => {
    const result = await service.create({
      name: "",
      content: "Hello",
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(result.error.message).toBe("name is required");
    }
  });

  it("gets template with code validation", async () => {
    const result = await service.get("WELCOME_001");

    expect(result.isSuccess).toBe(true);
    expect(mockProvider.getTemplate).toHaveBeenCalledWith(
      "WELCOME_001",
      undefined,
    );
  });

  it("updates template with patch validation", async () => {
    const result = await service.update("WELCOME_001", {
      name: "New Name",
    });

    expect(result.isSuccess).toBe(true);
    expect(mockProvider.updateTemplate).toHaveBeenCalledWith(
      "WELCOME_001",
      { name: "New Name" },
      undefined,
    );
  });

  it("fails update when code is missing", async () => {
    const result = await service.update("", { name: "New Name" });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
    }
  });

  it("deletes template", async () => {
    const result = await service.delete("WELCOME_001");

    expect(result.isSuccess).toBe(true);
    expect(mockProvider.deleteTemplate).toHaveBeenCalledWith(
      "WELCOME_001",
      undefined,
    );
  });

  it("lists templates", async () => {
    const result = await service.list({ status: "APPROVED" });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual([mockTemplate]);
    }
  });

  it("requests inspection when supported", async () => {
    const result = await service.requestInspection("WELCOME_001");

    expect(result.isSuccess).toBe(true);
    expect(mockInspectionProvider.requestTemplateInspection).toHaveBeenCalled();
  });

  it("fails inspection request when unsupported", async () => {
    const noInspectionService = new TemplateLifecycleService(mockProvider);

    const result = await noInspectionService.requestInspection("WELCOME_001");

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      expect(result.error.message).toContain("not supported");
    }
  });
});
