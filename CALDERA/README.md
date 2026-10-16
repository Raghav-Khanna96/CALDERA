# CALDERA — Spatial Design Studio

A fictional spatial design studio portfolio with an interactive architectural concept, blue reflective water, procedural lava, typography physics, synthesized audio and a playable spatial field.

## Edit and run

Install Node.js 24 LTS. Extract this ZIP, open the extracted folder in VS Code, and run in its terminal:

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. Do not double-click index.html; this project needs the development server or a production build.

```sh
node verify-palette.mjs
npm run build
npm run preview
```

## What to edit

| File | Purpose |
| --- | --- |
| src/portfolio.js | Name, portfolio copy, case study and challenge demos |
| index.html | Base page structure, title and search description |
| src/style.css, src/experience.css, src/portfolio.css | Layout, typography, responsive styling |
| src/scene.js | Architecture, lighting, camera and movement |
| src/shaders.js | Water, lava, sky and spatial field |
| src/audio.js | Synthesizer, notes and volume |
| src/showcase.js, src/showcase.css | Guided presentation and playable instrument |
| src/gravity.js | Falling typography and rebuild |
| src/palette.js | Controlled palette and contrast guard |

## GitHub

1. Create an empty repository in your GitHub account.
2. Extract the source ZIP. Upload its contents, not the ZIP itself, with package.json and netlify.toml at repository root. Include .gitignore and .nvmrc.
3. Do not upload node_modules or dist. They are generated automatically.

Or run these commands in the extracted folder, replacing YOUR-REPOSITORY-URL with the actual URL:

```sh
git init
git add .
git commit -m "Add TIDELINE portfolio"
git branch -M main
git remote add origin YOUR-REPOSITORY-URL
git push -u origin main
```

GitHub stores the editable source. Use Netlify below to host the website.

## Netlify — connected to GitHub

Import your GitHub repository into Netlify. Configuration is already included in netlify.toml:

- Base directory: leave empty when the files are at repository root
- Build command: npm run build
- Publish directory: dist
- Node version: 24
- Environment variables: none required

After linking the repository, pushes trigger rebuilds and deployment. If you placed everything inside a subfolder, set Netlify's base directory to that subfolder.

## Netlify — manual upload

For an immediate deployment, extract the separate CALDERA-Netlify-Deploy.zip. Drag the extracted folder containing index.html, assets/ and fonts/ to https://app.netlify.com/drop while signed in.

For future changes: edit the source, run npm run build, then upload the newly generated dist folder. Uploading old compiled files will not include your edits.

Netlify documentation:
- https://docs.netlify.com/deploy/create-deploys/
- https://docs.netlify.com/build/configure-builds/file-based-configuration/

## Controls

- Wheel/swipe or arrows: chapter navigation
- Day/night switch: blue water / lava
- Sound: starts only after a click
- Double-click the scene or G: gravity; R: rebuild
- Play the Scene: notes C D E G A, keyboard 1–5
- Judge Demo: feature demonstrations, volume check and a stoppable 24-second showcase

Reduced motion is available through Index and follows the system preference. Browser audio may require the tab/device to be unmuted.

## Dependencies and notices

This package contains no platform branding, hosted-service configuration, accounts, API keys or backend dependency. Third-party software and font license notices remain intact. Three.js, Matter.js, GSAP, Vite and the fonts retain their upstream license terms; see THIRD-PARTY-NOTICES.md. No overall open-source license is assigned to the portfolio; choose one before granting reuse rights if desired.

The challenge panel demonstrates implementation behavior. It does not certify organizer eligibility. Lava is an artistic shader simulation, not a physical engineering model.
