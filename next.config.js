const withNextra = require('nextra')({
  theme: 'nextra-theme-blog',
  themeConfig: './theme.config.js'
})

module.exports = withNextra({
  // Any other Next.js config
  async rewrites() {
    return [
      { source: '/resume', destination: '/resume.html' },
    ];
  },
})
