// commitlint.config.cjs
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0] // disable the subject-case enforcement
  }
};
