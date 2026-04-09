const fs = require('fs');

let c = fs.readFileSync('src/app/past-meets/PastMeetsClient.tsx', 'utf8');

// Change card and accordion containers to use a wider responsive max-width
c = c.replace(/className="w-full md:w-3\/4 lg:w-2\/3/g, 'className="w-full max-w-4xl');
c = c.replace(/className="w-full md:w-3\/4 lg:w-2\/3 mt-8 /g, 'className="w-full max-w-4xl mt-8 ');

// Also make search bar a bit wider
c = c.replace(/className="relative mb-8 w-full md:w-2\/3 lg:w-1\/2/g, 'className="relative mb-8 w-full max-w-2xl');

// Allow title to wrap gracefully instead of strict single-line truncation that clips text too early
c = c.replace(/truncate break-all/g, 'line-clamp-2');

fs.writeFileSync('src/app/past-meets/PastMeetsClient.tsx', c);
console.log('Fixed widths!');
