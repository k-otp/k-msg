import { evidence, type ITtscEvidenceGraphConfig } from "@ttsc/evidence";
import type { ITtscLintConfig } from "@ttsc/lint";

// Normative documents whose every section must be answered by the code that
// implements it. `requireReview` pins each answer to a fingerprint of the cited
// section, so editing a policy expires the reviews written against it and the
// build fails until the implementation is re-verified.
const graph: ITtscEvidenceGraphConfig = {
  claims: [
    {
      name: "KR B2B retention baseline",
      type: "typescript",
      files: ["packages/messaging/src/delivery-tracking/retention.ts"],
      reference: {
        type: "markdown",
        files: ["docs/compliance/kr-b2b-retention.md"],
        symbol: "h2",
        requireReview: true,
      },
    },
  ],
};

export default {
  extends: "./lint.config.ts",
  plugins: { evidence },
  rules: {
    "evidence/graph": ["error", graph],
  },
} satisfies ITtscLintConfig;
