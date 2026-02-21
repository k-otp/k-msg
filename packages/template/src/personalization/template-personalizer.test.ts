import { describe, expect, test } from "bun:test";
import {
  defaultTemplatePersonalizer,
  TemplatePersonalizer,
  TemplateVariableUtils,
} from "../index";

describe("TemplatePersonalizer", () => {
  test("replaces simple variables", () => {
    const personalizer = new TemplatePersonalizer();

    const result = personalizer.replace(
      "안녕하세요, #{name}님! 인증코드는 #{code}입니다.",
      {
        name: "홍길동",
        code: "123456",
      },
    );

    expect(result.content).toBe("안녕하세요, 홍길동님! 인증코드는 123456입니다.");
    expect(result.missingVariables).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  test("captures missing variables", () => {
    const personalizer = new TemplatePersonalizer({
      allowUndefined: false,
    });

    const result = personalizer.replace("#{name} #{code}", {
      name: "홍길동",
    });

    expect(result.content).toBe("홍길동 ");
    expect(result.missingVariables).toContain("code");
    expect(result.errors[0]?.type).toBe("missing_variable");
  });

  test("supports formatting", () => {
    const personalizer = new TemplatePersonalizer({
      enableFormatting: true,
    });

    const result = personalizer.replace("#{name|upper} #{amount|currency}", {
      name: "john doe",
      amount: 50000,
    });

    expect(result.content).toContain("JOHN DOE");
    expect(result.content).toContain("₩50,000");
  });

  test("extracts variables", () => {
    const personalizer = new TemplatePersonalizer();

    expect(
      personalizer.extractVariables("#{name}님 #{product} #{quantity}"),
    ).toEqual(["name", "product", "quantity"]);
  });

  test("default personalizer is configured for case-insensitive matching", () => {
    const result = defaultTemplatePersonalizer.replace("#{NAME}", {
      name: "홍길동",
    });

    expect(result.content).toBe("홍길동");
  });
});

describe("TemplateVariableUtils", () => {
  test("provides utility helpers", () => {
    const content = "#{name}님, 인증코드: #{code}";
    const variables = { name: "홍길동", code: "123456" };

    expect(TemplateVariableUtils.extractVariables(content)).toEqual([
      "name",
      "code",
    ]);
    expect(TemplateVariableUtils.replace(content, variables)).toBe(
      "홍길동님, 인증코드: 123456",
    );
    expect(TemplateVariableUtils.validate(content, variables)).toBe(true);
  });

  test("personalizes content for multiple recipients", () => {
    const personalized = TemplateVariableUtils.personalize(
      "안녕하세요, #{name}님! 코드: #{code}",
      [
        {
          phoneNumber: "01012345678",
          variables: { name: "홍길동", code: "111111" },
        },
        {
          phoneNumber: "01087654321",
          variables: { name: "김철수", code: "222222" },
        },
      ],
    );

    expect(personalized).toHaveLength(2);
    expect(personalized[0]?.content).toBe("안녕하세요, 홍길동님! 코드: 111111");
    expect(personalized[1]?.content).toBe("안녕하세요, 김철수님! 코드: 222222");
  });
});
