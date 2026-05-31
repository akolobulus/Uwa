const fs = require('fs'); fs.writeFileSync('src/app/page.tsx', Buffer.from(process.argv[2], 'base64').toString('utf8'));
