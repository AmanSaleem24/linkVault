import { prisma } from './src/lib/prisma'

async function main() {
  const links = await prisma.link.findMany()
  if (links.length === 0) {
    console.log("No links found to seed.")
    return
  }

  const link = links[0]
  console.log("Seeding clicks for link:", link.slug)

  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Mobile Safari']
  const osList = ['Windows', 'macOS', 'iOS', 'Android', 'Linux']
  const devices = ['Desktop', 'Mobile', 'Tablet']
  const countries = ['US', 'UK', 'CA', 'AU', 'IN', 'DE', 'FR']
  const referrers = ['direct', 'google.com', 'twitter.com', 'linkedin.com', 'facebook.com']

  let count = 0
  for (let i = 0; i < 250; i++) {
    const pastDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    await prisma.click.create({
      data: {
        linkId: link.id,
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: osList[Math.floor(Math.random() * osList.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        clickedAt: pastDate
      }
    })
    count++
  }
  
  await prisma.link.update({
    where: { id: link.id },
    data: { clickCount: link.clickCount + count }
  })
  
  console.log(`Successfully seeded ${count} clicks!`)
}

main().catch(console.error).finally(async () => {
  // await prisma.$disconnect() // might not be needed with neon pool
  process.exit(0)
})
