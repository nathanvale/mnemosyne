/* wallaby.js */
// eslint-disable-next-line no-undef
module.exports = () => ({
  autoDetect: true,

  files: {
    override: (filePatterns) => {
      return filePatterns
    },
  },

  tests: {
    override: (filePatterns) => filePatterns.concat(['!**/*.stories.tsx']),
  },
})
