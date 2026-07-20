import { prisma, prismaQuery } from '../src/lib/prisma'

async function main() {
  console.log('Starting seed...')
  
  // Get all users
  const users = await prismaQuery(() => prisma.user.findMany())
  if (users.length === 0) {
    console.log('No users found! Please sign up first.')
    return
  }

  for (const user of users) {
    console.log(`\n========================================`)
    console.log(`Seeding data for user: ${user.email}`)

  const mockLinks = [
    { url: 'https://github.com', slug: 'github-profile' },
    { url: 'https://vercel.com', slug: 'vercel-dash' },
    { url: 'https://react.dev', slug: 'react-docs' },
    { url: 'https://news.ycombinator.com', slug: 'hn' },
    { url: 'https://stripe.com/docs', slug: 'stripe-api' },
  ]

  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera']
  const os = ['Windows', 'macOS', 'Linux', 'iOS', 'Android']
  const devices = ['desktop', 'mobile', 'tablet']
  const countries = ['US', 'IN', 'GB', 'CA', 'DE', 'FR', 'AU']
  const referrers = ['https://google.com', 'https://twitter.com', 'https://github.com', 'Direct', 'https://linkedin.com']
  const utmSources = ['twitter', 'google', 'newsletter', 'linkedin', null, null]
  const utmMediums = ['social', 'cpc', 'email', 'organic', null]
  const utmCampaigns = ['summer_sale', 'launch_2026', 'weekly_digest', null, null]

    for (const item of mockLinks) {
      // Append a tiny substring of user id to slug to avoid unique constraint conflicts across users
      const uniqueSlug = `${item.slug}-${user.id.slice(-4)}`
      
      let link = await prismaQuery(() => prisma.link.findUnique({ where: { slug: uniqueSlug } }))
      
      if (!link) {
        link = await prismaQuery(() => prisma.link.create({
          data: {
            userId: user.id,
            originalUrl: item.url,
            slug: uniqueSlug,
            status: 'active',
            clickCount: 0,
          }
        }))
        console.log(`Created link: /${link.slug}`)
      } else {
        console.log(`Link /${link.slug} already exists.`)
      }

      // Generate random clicks over the last 30 days
      const numClicks = Math.floor(Math.random() * 200) + 50 // 50 to 250 clicks
      console.log(`Generating ${numClicks} clicks for /${link.slug}...`)

      const clickData = Array.from({ length: numClicks }).map(() => {
        const daysAgo = Math.floor(Math.random() * 30)
        const clickedAt = new Date()
        clickedAt.setDate(clickedAt.getDate() - daysAgo)
        
        return {
          linkId: link.id,
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: os[Math.floor(Math.random() * os.length)],
          device: devices[Math.floor(Math.random() * devices.length)],
          country: countries[Math.floor(Math.random() * countries.length)],
          referrer: referrers[Math.floor(Math.random() * referrers.length)],
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          utmSource: utmSources[Math.floor(Math.random() * utmSources.length)],
          utmMedium: utmMediums[Math.floor(Math.random() * utmMediums.length)],
          utmCampaign: utmCampaigns[Math.floor(Math.random() * utmCampaigns.length)],
          clickedAt,
        }
      })

      await prismaQuery(() => prisma.click.createMany({ data: clickData }))

      // Update click count on link
      const currentLink = await prismaQuery(() => prisma.link.findUnique({ where: { id: link!.id } }))
      await prismaQuery(() => prisma.link.update({
        where: { id: link!.id },
        data: { clickCount: (currentLink?.clickCount || 0) + numClicks }
      }))
    }
  }

  console.log('Seed completed successfully!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
