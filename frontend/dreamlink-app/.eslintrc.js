module.exports = {
  root: true,
  extends: ['expo'],
  overrides: [
    {
      files: ['**/__tests__/**/*.{js,jsx,ts,tsx}'],
      env: {
        jest: true,
      },
    },
  ],
};
