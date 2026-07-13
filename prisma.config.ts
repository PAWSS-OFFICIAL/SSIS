export default {
  earlyAccess: true,
  schema: {
    kind: 'single',
    filePath: 'prisma/schema.prisma',
  },
  db: {
    url: process.env.DATABASE_URL,
  },
}
