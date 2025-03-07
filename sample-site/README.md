# MCP DigitalOcean Deployment Demo

This is a sample static website for testing the MCP DigitalOcean server. It demonstrates how to deploy a static website to DigitalOcean App Platform using the Model Context Protocol (MCP).

## Files

- `index.html` - The main HTML file for the website
- `styles.css` - The CSS file for styling the website
- `README.md` - This file
- `preview.js` - A simple HTTP server for previewing the site locally

## Deployment

This website can be deployed to DigitalOcean App Platform using the MCP DigitalOcean server in Cursor:

1. Push this code to a GitHub repository
2. In Cursor's Composer, ask to deploy the site with parameters like:

```
Please deploy my static site to DigitalOcean with these parameters:
- DigitalOcean API token: YOUR_TOKEN_HERE
- App name: mcp-demo-site
- Repository: wadewegner/mcp-servers
```

3. Cursor will use the MCP DigitalOcean server to handle the deployment
4. You'll receive the deployment status and URL when complete

### Required Parameters

- `token`: Your DigitalOcean API token with write access
- `app_name`: A name for your app
- `repo`: GitHub repository (username/repo)

### Optional Parameters (with defaults)

- `region`: Region code (e.g., nyc, sfo) - Default: "nyc"
- `branch`: Branch to deploy - Default: "main"
- `source_dir`: Directory in repo containing source code - Default: "/"
- `build_command`: Build command (if needed)
- `output_dir`: Directory where build outputs files
- `deploy_on_push`: Auto-deploy on git push - Default: true
- `environment_slug`: Runtime environment - Default: "html"
- `custom_domain`: Custom domain (optional)

## Features

- Responsive design that works on all devices
- Modern, clean UI with gradient accents
- Informative content about the MCP DigitalOcean server
- Deployment information displayed on the page

## Preview

When deployed, the website will display information about the deployment, including the time it was deployed and that it was deployed using the MCP DigitalOcean server.

### Local Preview

To preview the site locally:

```bash
cd sample-site
node preview.js
```

Then open http://localhost:3000 in your browser. 