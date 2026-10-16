# Third-party notices

The original application and third-party dependencies have separate licensing terms. Preserve upstream copyright and license notices when redistributing dependencies.

- Three.js: MIT; installed package includes its LICENSE.
- Matter.js: MIT; installed package includes its LICENSE.
- Vite: MIT; installed package includes its LICENSE.
- GSAP: the installed package declares its license at https://gsap.com/standard-license. Preserve its source copyright notices and applicable upstream terms.
- DM Sans and Instrument Serif: bundled font licenses are in public/fonts/.

Dependency license files are copied into licenses/ for convenience. The lockfile pins the complete dependency tree; npm ci installs it. Build tools and transitive packages retain their own license terms.
