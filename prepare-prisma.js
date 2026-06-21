const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  let schema = fs.readFileSync(schemaPath, 'utf8');
  const isPostgres = process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'));

  if (isPostgres) {
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    console.log('Prisma: Configured database provider to "postgresql" for production');
  } else {
    schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    console.log('Prisma: Configured database provider to "sqlite" for development');
  }

  fs.writeFileSync(schemaPath, schema);
} else {
  console.warn('Prisma: schema.prisma not found at', schemaPath);
}
