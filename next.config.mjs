import nextra from 'nextra'

// Set up Nextra with its configuration
const withNextra = nextra({
  theme: 'nextra-theme-blog',
  themeConfig: './theme.config.js'
})

// Export the final Next.js config with Nextra included
export default withNextra()
