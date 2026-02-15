import { describe, expect, it, mock } from "bun:test";
import {
  fail,
  KMsgError,
  KMsgErrorCode,
  ok,
  Result,
  type Template,
  type TemplateCreateInput,
  type TemplateProvider,
} from "@k-msg/core";
import { TemplateService } from "./service";

describe("TemplateService", () => {
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

  const service = new TemplateService(mockProvider);

  describe("create", () => {
    it("should create a template successfully", async () => {
      const input: TemplateCreateInput = {
        name: "Welcome Template",
        content: "Hello, #{name}!",
        category: "NOTIFICATION",
      };

      const result = await service.create(input);

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockTemplate);
      }
      expect(mockProvider.createTemplate).toHaveBeenCalled();
    });

    it("should return failure if name is missing", async () => {
      const result = await service.create({
        name: "",
        content: "Hello",
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      }
    });

    it("should return failure if content is missing", async () => {
      const result = await service.create({
        name: "Name",
        content: "",
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.code).toBe(KMsgErrorCode.INVALID_REQUEST);
      }
    });
  });

  describe("get", () => {
    it("should get a template successfully", async () => {
      const result = await service.get("WELCOME_001");

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual(mockTemplate);
      }
      expect(mockProvider.getTemplate).toHaveBeenCalledWith(
        "WELCOME_001",
        undefined,
      );
    });

    it("should return failure if code is missing", async () => {
      const result = await service.get("");
      expect(result.isFailure).toBe(true);
    });
  });

  describe("update", () => {
    it("should update a template successfully", async () => {
      const result = await service.update("WELCOME_001", { name: "New Name" });

      expect(result.isSuccess).toBe(true);
      expect(mockProvider.updateTemplate).toHaveBeenCalledWith(
        "WELCOME_001",
        {
          name: "New Name",
        },
        undefined,
      );
    });
  });

  describe("delete", () => {
    it("should delete a template successfully", async () => {
      const result = await service.delete("WELCOME_001");

      expect(result.isSuccess).toBe(true);
      expect(mockProvider.deleteTemplate).toHaveBeenCalledWith(
        "WELCOME_001",
        undefined,
      );
    });
  });

  describe("list", () => {
    it("should list templates successfully", async () => {
      const result = await service.list({ status: "APPROVED" });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toEqual([mockTemplate]);
      }
      expect(mockProvider.listTemplates).toHaveBeenCalled();
    });
  });
});
