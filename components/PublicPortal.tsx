Run npm install && npm run build

added 107 packages, and audited 108 packages in 13s

7 packages are looking for funding
  run `npm fund` for details

2 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

> ferrecloud-arca@1.0.2 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 2305 modules transformed.
x Build failed in 2.84s
error during build:
components/PublicPortal.tsx (8:42): "CloudDownload" is not exported by "node_modules/lucide-react/dist/esm/lucide-react.js", imported by "components/PublicPortal.tsx".
file: /home/runner/work/sistema-bruzzone/sistema-bruzzone/components/PublicPortal.tsx:8:42

 6:     ChevronRight, CreditCard, Tag, Percent, RefreshCw, X,
 7:     ShieldCheck, ShoppingCart, Plus, Minus, Send, Package, Trash2,
 8:     Ticket, CheckCircle, ArrowLeft, User, CloudDownload, Zap
                                              ^
 9: *** from 'lucide-react';
10: import *** Client, CompanyConfig, Product, InvoiceItem, Coupon *** from '../types';

    at getRollupError (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/parseAst.js:401:41)
    at error (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/parseAst.js:397:42)
    at Module.error (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:17022:16)
    at Module.traceVariable (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:17478:29)
    at ModuleScope.findVariable (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:15141:39)
    at ReturnValueScope.findVariable (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:5688:38)
    at FunctionBodyScope.findVariable (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:5688:38)
    at TrackingScope.findVariable (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:5688:38)
    at BlockScope.findVariable (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:5688:38)
    at Identifier.bind (file:///home/runner/work/sistema-bruzzone/sistema-bruzzone/node_modules/rollup/dist/es/shared/node-entry.js:5462:40)
Error: Process completed with exit code 1.
