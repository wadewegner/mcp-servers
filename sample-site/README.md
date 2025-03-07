# MCP DigitalOcean Deployment Demo

This is a sample static website for testing the MCP DigitalOcean server. It demonstrates how to deploy a static website to DigitalOcean App Platform using the Model Context Protocol (MCP).

## Files

- `index.html` - The main HTML file for the website
- `styles.css` - The CSS file for styling the website
- `README.md` - This file

## Deployment

This website can be deployed to DigitalOcean App Platform using the MCP DigitalOcean server. Here's how:

1. Push this code to a GitHub repository
2. Use the MCP DigitalOcean server to deploy the website:

```
deploy-static-site
  token: YOUR_DIGITALOCEAN_API_TOKEN
  app_name: mcp-demo-site
  region: nyc
  repo: your-username/your-repo
  branch: main
  source_dir: /sample-site
  environment_slug: html
```

## Features

- Responsive design that works on all devices
- Modern, clean UI with gradient accents
- Informative content about the MCP DigitalOcean server
- Deployment information displayed on the page

## Preview

When deployed, the website will display information about the deployment, including the time it was deployed and that it was deployed using the MCP DigitalOcean server. 