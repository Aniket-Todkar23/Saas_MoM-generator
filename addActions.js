const fs = require('fs');
const file = 'src/app/past-meets/PastMeetsClient.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'const [currentPage, setCurrentPage] = useState(1)',
  `const [currentPage, setCurrentPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handlePrint = (meet: Meeting) => {
    const win = window.open('', '_blank')
    if (!win) return
    const el = document.getElementById(\`meet-content-\${meet.id}\`)
    const htmlContent = el ? el.innerHTML : meet.content

    win.document.write(\`
      <html>
        <head>
          <title>\${meet.title}</title>
          <style>
            @media print {
              @page { margin: 20mm; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; }
            h2 { font-size: 1.25rem; font-weight: bold; margin-bottom: 0.75rem; margin-top: 1.5rem; }
            h3 { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.5rem; margin-top: 1rem; }
            p { margin-bottom: 1rem; }
            ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
            ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
            li { margin-bottom: 0.25rem; }
            strong { font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>\${meet.title}</h1>
          <p style="color: #666; margin-bottom: 2rem;"><em>\${format(new Date(meet.createdAt), 'MMM d, yyyy - h:mm a')}</em></p>
          <div class="content">
            \${htmlContent}
          </div>
        </body>
      </html>
    \`)
    win.document.close()
    win.focus()
    setTimeout(() => {
      win.print()
      win.close()
    }, 250)
  }`
);

c = c.replace(
  '<article className="text-sm md:text-base',
  `<div className="flex justify-end gap-2 mb-4">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleCopy(meet.id, meet.content); }}>
                          {copiedId === meet.id ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                          {copiedId === meet.id ? "Copied" : "Copy"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handlePrint(meet); }}>
                          <Printer className="w-4 h-4 mr-2" />
                          Print
                        </Button>
                      </div>
                      <article id={\`meet-content-\${meet.id}\`} className="text-sm md:text-base`
);

fs.writeFileSync(file, c);
console.log('actions added');