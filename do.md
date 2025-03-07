

# Deploying a Static Website to DigitalOcean App Platform via API: Step-by-Step Guide

Deploying a static HTML/CSS website on DigitalOcean’s App Platform can be done entirely through API calls, without using the web UI or `doctl`. This guide walks through authentication, preparing the app spec (configuration), making API requests to create and deploy the app, and handling common errors. Each step includes example API requests (with cURL) and expected responses, so you have everything needed without referring to external docs.

## 1. Authentication & API Setup

Before making any API calls, obtain a Personal Access Token from DigitalOcean and ensure it has the proper permissions:

- **Generate an API Token:** Log in to your DigitalOcean Control Panel and navigate to the API section. Under “Tokens/Keys”, click **Generate New Token**. Give it a name and select the required scopes or permissions. At minimum, enable **write access** for the token so it can create and modify resources (this implicitly includes read access) ([Limit Scope of API Token to Resource(s) | DigitalOcean](https://www.digitalocean.com/community/questions/limit-scope-of-api-token-to-resource-s#:~:text=,Platform%20apps%20and%20their%20logs)). If using DigitalOcean’s custom scopes, include scopes for App Platform (e.g. `app:read` to view apps and `app:write` or `app:update` to create/deploy apps) ([Limit Scope of API Token to Resource(s) | DigitalOcean](https://www.digitalocean.com/community/questions/limit-scope-of-api-token-to-resource-s#:~:text=,Platform%20apps%20and%20their%20logs)). Finally, save the token — you’ll need this string for authentication.

- **Authentication Header:** DigitalOcean uses bearer token auth for API calls. Include the token in an HTTP header `Authorization: Bearer YOUR_TOKEN` on every request ([
    
        How to Create a Personal Access Token | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/reference/api/create-personal-access-token/#:~:text=To%20use%20the%20DigitalOcean%20API%2C,header%20with%20your%20request)). Treat this token like a password (keep it secret). Also set `Content-Type: application/json` on requests with JSON bodies.

- **API Endpoint:** The base URL for App Platform API is `https://api.digitalocean.com/v2/apps` ([
    
        App Platform Reference | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/#:~:text=The%20DigitalOcean%20API%20lets%20you,also%20available%20through%20the%20API)). All App Platform actions available in the control panel are accessible through this API. We will be hitting this endpoint (and sub-endpoints) with our HTTP requests.

**Example – Setting up headers for cURL:** 

```bash
# Replace YOUR_TOKEN with your personal access token
COMMON_HEADERS=(-H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json")
```

With the token ready and headers set, you can now proceed to define your app configuration and make API calls.

## 2. App Spec Details

The **App Spec** is a JSON (or YAML) configuration that describes your application – its components, source code, build settings, environment variables, etc. We will create a spec for a static site. In our case, the site is just HTML/CSS (no server-side code). An app spec allows you to fully define the app for the API ([
    
        Reference for App Specification | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/app-spec/#:~:text=As%20an%20alternative%20to%20configuring,apps%20with%20the%20%2035)).

**Required fields in the App Spec JSON:**

- **name:** A name for your app (must be unique per DigitalOcean account). This is a human-friendly identifier for the app.
- **region:** The data center region to deploy in (e.g. `"nyc"` for New York, `"sfo"` for San Francisco, etc.). Use a region code closest to your users or `nearest` for automatic selection. For example, `"region": "nyc"` ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=)).
- **static_sites:** An array of static site components. For a single static website, define one object in this array. This object includes:  
  - **name:** A name for the static site component (e.g. `"website"`). It must be unique within the app ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites)).  
  - **github / git / gitlab / bitbucket (source repository):** Specify where your code is stored. You have a few options: 
    - **github:** If your code is on GitHub and your DigitalOcean account is linked to GitHub, provide the repo info here. Example:  
      ```json
      "github": { 
         "repo": "username/repo-name", 
         "branch": "main", 
         "deploy_on_push": true 
      }
      ```  
      This tells App Platform to pull from the GitHub repo “username/repo-name”, use the `main` branch, and auto-deploy on new commits ([
    
        Reference for App Specification | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/app-spec/#:~:text=git%3A%20repo_clone_url%3A%20https%3A%2F%2Fgithub.com%2Fuser%2Frepo,name)). The `deploy_on_push` flag instructs App Platform to set up a webhook so any push triggers a deployment. (If you prefer manual deploys only, set this to false.)  
    - **git:** Alternatively, you can specify a direct Git URL. Use the `git` field with a `repo_clone_url`. For example, `"repo_clone_url": "https://github.com/username/repo-name.git"` and a `branch`. This is useful if you cannot use the integrated GitHub/GitLab connection (e.g. for a public repo or custom Git service) ([
    
        Reference for App Specification | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/app-spec/#:~:text=static_sites%3A%20,name%20branch%3A%20main%20deploy_on_push%3A%20true)). For private repos via `git`, you would need to include credentials in the URL or pre-configure an SSH key in App Platform.  
    - **gitlab / bitbucket:** Similarly, if your code is on GitLab or Bitbucket, you can use the `gitlab` or `bitbucket` object with `repo`, `branch`, and `deploy_on_push` ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites,No)) ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites,No)). Ensure your DO account is connected to the respective service for access.
  - **environment_slug:** (Optional) The runtime environment for the build. For plain static sites, use `"html"` which is an environment for static HTML/CSS/JS content ([Hosting Static Content with DigitalOcean - Elmar Klausmeier's Blog on Computers, Programming, and Mathematics](https://eklausmeier.goip.de/blog/2024/10-13-hosting-static-content-with-digitalocean#:~:text=region%3A%20fra%20static_sites%3A%20,io%20source_dir%3A)). This essentially tells App Platform to use the default static site buildpack (an Nginx static server environment). If not provided, App Platform will auto-detect based on your repo content. For example, if your static site uses Node (a React/Vue static app), you might use `"node-js"` so you can run build commands. In most cases for pure HTML/CSS you can use `"html"` or omit this field for auto-detection.  
  - **source_dir:** The directory in your repository containing the site’s source code. This is relative to the repo root. Use `"/"` for the root of the repo (common for most projects) ([Hosting Static Content with DigitalOcean - Elmar Klausmeier's Blog on Computers, Programming, and Mathematics](https://eklausmeier.goip.de/blog/2024/10-13-hosting-static-content-with-digitalocean#:~:text=,io%20source_dir%3A)). If your website files are in a subfolder (say `/site`), specify that path. App Platform will use this as the working directory for building and deploying this static site.
  - **build_command:** (Optional) The command to build your site, if it requires a build step. For a plain HTML/CSS site, you likely don’t need any build command (leave it empty or omit it). If you are using a static site generator or bundler, put the command here. For example, `"build_command": "npm install && npm run build"` for a React app, or `"build_command": "bundle exec jekyll build -d ./public"` for a Jekyll site ([Static site ignores environment_slug | DigitalOcean](https://www.digitalocean.com/community/questions/static-site-ignores-environment_slug#:~:text=region%3A%20nyc%20static_sites%3A%20,main%20deploy_on_push%3A%20true%20repo%3A%20XYZ%2FXYZ)). This command runs in the source directory and should output the final static files.
  - **output_dir:** (Optional) The directory (relative to the source_dir) where the build outputs the final static files. For plain HTML (no build step), you can omit this or set it to `/` (root) since the files to serve are in the source directory itself. If you used a build (above), set `output_dir` to the folder containing the built site. For example, if a React build outputs to a `build` folder, use `"output_dir": "build"`. If not set, App Platform will try common directories like `dist`, `public`, `build`, or `_static` automatically ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites)). Ensuring this is correct is crucial — App Platform will serve files from this directory.
  - **envs:** (Optional) Environment variables for the static site. Static sites generally don’t need runtime env vars, but you might need build-time variables (e.g. an API key that gets embedded at build). You can provide an array of environment variable objects. Each object has `key` and `value`, and optionally `type` (defaults to “GENERAL” for plaintext or “SECRET” for encrypted secrets) and `scope` (“BUILD_TIME`, “RUN_TIME`, or both) ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites)) ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites)). For example:  
    ```json
    "envs": [
       { "key": "API_BASE_URL", "value": "https://example.com/api", "scope": "RUN_TIME" }
    ]
    ```  
    This would make `API_BASE_URL` available (for a build tool or in frontend code) as an environment variable. Use `type: "SECRET"` for sensitive values – the first time you submit, the API will encrypt it ([
    
        Reference for App Specification | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/app-spec/#:~:text=error_document%3A%20404.html%20envs%3A%20,1%3AzqiRIeaaYK%2FNqctZDYzy6t0pTrtRDeq8%3AwqGpZRrsKN5nPhWQrS479cfBiXT0WQ)). For plain static sites, you can likely skip envs unless needed for a build process or configuration.

- **alerts:** (Optional) You can set up alert rules for events like deployment failures. For example, an alert rule for `DEPLOYMENT_FAILED` will notify you (via email) if a deployment fails ([Hosting Static Content with DigitalOcean - Elmar Klausmeier's Blog on Computers, Programming, and Mathematics](https://eklausmeier.goip.de/blog/2024/10-13-hosting-static-content-with-digitalocean#:~:text=2,configuration%20for%20static%20sites%20is)). This is not required but recommended for production apps. In JSON spec, alerts would be an array of `{ "rule": "DEPLOYMENT_FAILED" }` etc.
- **ingress (routes):** (Optional for single-component apps) Ingress rules define how requests are routed. If your app has only one static site, you don’t need to explicitly set this – by default, the static site will serve at the root path (`/`) of your app’s URL ([Hosting Static Content with DigitalOcean - Elmar Klausmeier's Blog on Computers, Programming, and Mathematics](https://eklausmeier.goip.de/blog/2024/10-13-hosting-static-content-with-digitalocean#:~:text=features%3A%20,io%20match%3A%20path%3A%20prefix%3A)). If you have multiple components, you would use ingress rules to route paths to each component. We’ll omit ingress for this simple case (App Platform will auto-create a default route to your static site).

- **domains:** (Optional) If you plan to use a custom domain (like `yourdomain.com`) for the site, you can include a `domains` array in the spec. Each domain entry can specify a hostname and whether it’s primary. For example:  
  ```json
  "domains": [
      { "name": "yourdomain.com", "type": "PRIMARY" }
  ]
  ```  
  If the domain is managed in DigitalOcean DNS, you can also add `"zone": "yourdomain.com"` so that App Platform will auto-configure DNS ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=A%20set%20of%20hostnames%20where,the%20application%20will%20be%20available)). Custom domains are not required for deployment (you can add them later via API too), but it’s good to know this field exists.

Putting it all together, here’s a **full JSON spec example** for a simple static site:

```json
{
  "spec": {
    "name": "my-static-site",
    "region": "nyc",
    "static_sites": [
      {
        "name": "website",
        "github": {
          "repo": "your-github-username/your-repo", 
          "branch": "main",
          "deploy_on_push": true
        },
        "environment_slug": "html",
        "source_dir": "/",
        "build_command": "",
        "output_dir": "/",
        "envs": []
      }
    ]
  }
}
```

**Explanation:** This spec will deploy the GitHub repo `your-github-username/your-repo` (main branch) as a static site. It’s named “my-static-site” and will be in the NYC region. We specify an empty build command (none needed) and use the repo’s root as both the source and output (since it’s plain HTML content). The environment is set to “html” (static HTML). There are no environment variables in this example. The `deploy_on_push: true` means any new commit to the repo triggers an automatic redeploy. 

> **Note:** Ensure that your DigitalOcean App Platform has access to the repository. If it’s a public GitHub repo, this will work as-is. If it’s private, make sure you have connected your GitHub account to DigitalOcean App Platform (through the control panel or an OAuth flow) so that the API can access the code. Otherwise, the deployment may fail with a repository access error.

## 3. API Calls for Deployment

With the spec ready and authentication in place, you can now create and deploy the app via API calls. We will use cURL in examples – you can use any HTTP client, just be sure to include the proper headers and JSON data.

### Creating the App

To create the app on App Platform, use the **Create App** API endpoint: 

```
POST https://api.digitalocean.com/v2/apps
```

This request should include your JSON app spec in the body, and your auth headers. For example:

```bash
curl -X POST "https://api.digitalocean.com/v2/apps" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
           "spec": {
             "name": "my-static-site",
             "region": "nyc",
             "static_sites": [
               {
                 "name": "website",
                 "github": {
                   "repo": "your-github-username/your-repo",
                   "branch": "main",
                   "deploy_on_push": true
                 },
                 "environment_slug": "html",
                 "source_dir": "/"
               }
             ]
           }
         }'
```

In this example, we omitted optional fields for brevity – the spec is the same as we discussed (if no `build_command` is provided, App Platform will just serve the files in `source_dir`/`output_dir`). Ensure the JSON is properly formatted and escaped in the `-d` string (or use a file with `curl -d @file.json`). A common mistake is JSON formatting issues which result in a `400 Bad Request` with an error about an invalid character ([python - DigitalOcean API Error When Creating New App - api.digitalocean.com/v2/apps - Stack Overflow](https://stackoverflow.com/questions/70423692/digitalocean-api-error-when-creating-new-app-api-digitalocean-com-v2-apps#:~:text=,invalid%20character%20%27s%27%20looking%20for)), so double-check the syntax.

**Expected Response:** On success, the API will return a `201 Created` status and a JSON body containing details of the new app. For example, the response will look like:

```json
{
  "app": {
    "id": "a1b2c3d4-...-uuid",
    "spec": { ... }, 
    "default_ingress": "https://my-static-site-abc123.ondigitalocean.app",
    "active_deployment": {
       "id": "dep-1234-uuid",
       "phase": "BUILDING",
       "created_at": "2025-03-07T14:30:00Z",
       ...
    },
    "created_at": "2025-03-07T14:29:50Z",
    ...
  }
}
```

Key parts of the response: The `app.id` is the unique identifier of your app – save this for future calls. `default_ingress` is the default URL (on *.ondigitalocean.app) where your site will be accessible. The response also includes an `active_deployment` object: as soon as the app is created, DigitalOcean starts a deployment for it. The `active_deployment.phase` may be `"BUILDING"` or `"PENDING_BUILD"` initially, indicating the build is in progress. The app spec you provided is echoed back under `spec`, and timestamps are provided.

> **Tip:** You can also use a “propose” endpoint (`POST /v2/apps/propose`) to validate your spec without actually creating the app ([POST /v2/apps/propose | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-propose-post-72a#:~:text=POST%20%2Fv2%2Fapps%2Fpropose%20,it%20for%20you%2C%20set)). This returns a preview including the cost and any errors in the spec. This can be used to catch mistakes early. However, it’s optional – if you’re confident in your spec, the create call above is enough.

### Monitoring Build & Deployment Status

After creating the app, you’ll want to monitor the deployment until it’s live. There are a few ways to check status via the API:

- **Get App Info:** `GET https://api.digitalocean.com/v2/apps/{app_id}` – this returns the app object, including the latest deployment status. For example:
  ```bash
  curl "${API_URL}/v2/apps/a1b2c3d4-uuid" "${COMMON_HEADERS[@]}"
  ```
  (Replace `a1b2c3d4-uuid` with your actual app ID, and reuse the headers array from earlier or include the auth headers directly.)  
  The response’s `app.active_deployment.phase` field will show the current phase. Possible phases include: `BUILDING` (compiling or bundling your site), `DEPLOYING` (releasing it to the platform), and `ACTIVE` (deployment is live). If something goes wrong, you might see `ERROR` here. Continue polling this endpoint every few seconds to see if the phase progresses to `ACTIVE`. You can also see `deployment_progress` and `created_at/updated_at` timestamps in the deployment object for more info.

- **List Deployments:** `GET /v2/apps/{app_id}/deployments` – returns all deployments of the app (the first one, and any subsequent ones). The list includes each deployment’s ID, phase, and cause (e.g. “Manual Re-deploy” or “Git commit push”). You can check the first deployment’s status from here as well. Typically, for a single deployment, `active_deployment` from the app info is sufficient.

- **Get Specific Deployment:** `GET /v2/apps/{app_id}/deployments/{deployment_id}` – if you have the deployment ID (from the create response or list), you can query that deployment directly for status and detailed info.

- **Logs:** To troubleshoot build issues, you may fetch logs via the API. The endpoint `GET /v2/apps/{app_id}/deployments/{deployment_id}/logs` returns logs for that deployment ([GET /v2/apps/{app_id}/deployments/{deployment_id}/logs #248 - GitHub](https://github.com/digitalocean/openapi/issues/248#:~:text=GET%20%2Fv2%2Fapps%2F%7Bapp_id%7D%2Fdeployments%2F%7Bdeployment_id%7D%2Flogs%20%23248%20,248%20%C2%B7%20digitalocean%2Fopenapi)). This includes build logs which are crucial if the site fails to build or deploy.

Initially, right after app creation, you should see the deployment move from build to active within a few minutes for a static site. Once `phase` is `"ACTIVE"`, your site is live on the default domain (you can test the URL given in `default_ingress`).

### Triggering a Deployment (Re-deploying)

If you enabled `deploy_on_push`, pushing to your repository will automatically trigger new deployments. You can also manually trigger deployments via the API. For instance, if you disabled auto-deploy or want to force a rebuild, use:

```
POST https://api.digitalocean.com/v2/apps/{app_id}/deployments
```

This endpoint creates a new deployment for the app. Typically, you don’t need to send a body for a standard redeploy; however, you can include `{"force_build": true}` to force a full rebuild without cache (useful if you want to ensure a clean build) ([How to use curl in gitlab-ci file? - Stack Overflow](https://stackoverflow.com/questions/51790984/how-to-use-curl-in-gitlab-ci-file#:~:text=variables%3A%20DEPLOY_CURL_COMMAND_BODY%3A%20,Deploy%20to%20DigitalOcean%20App%20Platform)). Example:

```bash
curl -X POST "https://api.digitalocean.com/v2/apps/$APP_ID/deployments" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"force_build": true}'
```

This will respond with a deployment object (ID, phase, etc.) just like the initial creation, and you can monitor it in the same way. The `force_build: true` is optional – if omitted, App Platform may reuse build cache for faster deploys if nothing changed. Including it ensures a fresh build each time.

**Notes on structuring requests:** All API requests should be authenticated with the Bearer token in the header. Ensure the URL and JSON structure are correct. The DigitalOcean API expects well-formed JSON and correct endpoints – a slight typo in the URL (for example, missing an “s” in `/apps`) or JSON will result in errors (e.g., a 404 if the endpoint is wrong, or a 400 if JSON is malformed). Using the correct base path `/v2/apps` is important (the API version v2 is required in the URL) ([
    
        App Platform Reference | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/#:~:text=The%20endpoint%20for%20the%20App,formed%20to%20make%20API%20calls)).

## 4. Error Handling & Troubleshooting

Deploying via API can run into a few common issues. Here’s how to handle and troubleshoot them:

- **Authentication Errors (401 Unauthorized):** If you get a 401 response, the API token is missing or incorrect. Verify the `Authorization: Bearer` header is set and the token is valid. Also check that the token has the necessary scopes. For example, a token without write permissions will fail to create an app. Ensure your token has full read/write or the specific `app:create`/`app:update` scopes ([Limit Scope of API Token to Resource(s) | DigitalOcean](https://www.digitalocean.com/community/questions/limit-scope-of-api-token-to-resource-s#:~:text=,Platform%20apps%20and%20their%20logs)) as discussed. Regenerate the token if in doubt, and use the new one.

- **Permission/Scope Errors (403 Forbidden):** If your token is valid but lacks permissions, you might see a 403 or an error message about scopes. Double-check the token’s scopes. For instance, if you see an error about “not allowed” or similar, ensure you included the **write** (update) scope for App Platform. Updating or creating apps requires more than read-only. In general, a fully privileged token (with all scopes or legacy “write” scope) avoids these issues in CI deployments.

- **Invalid Spec or Bad Request (400/422 errors):** If the JSON spec has an error, the API will return an error response with details. A 400 Bad Request with a message like “invalid character …” means the JSON is malformed (e.g., a stray comma or unquoted text) ([python - DigitalOcean API Error When Creating New App - api.digitalocean.com/v2/apps - Stack Overflow](https://stackoverflow.com/questions/70423692/digitalocean-api-error-when-creating-new-app-api-digitalocean-com-v2-apps#:~:text=,invalid%20character%20%27s%27%20looking%20for)). Validate your JSON (you can use a linter or JSON validator) if this occurs. A 422 Unprocessable Entity might occur if the spec JSON is well-formed but violates a rule – for example, missing a required field or using an unsupported value. The response typically includes an `"id"` and a `"message"` describing the issue. For instance, if you omit the `name` or `static_sites` fields, it will complain that those are required. Fix the spec according to the message and retry.  

- **Repository Access Errors:** If the app is created but the deployment fails quickly with an error related to the repo, it could be an access issue. For example, if you specified a private GitHub repo in the spec but haven’t linked your GitHub account to DigitalOcean, the build will fail to fetch the repo. The deployment’s logs (accessible via API or seen in the DO dashboard’s “Logs” section) will show an error like “repository not found or access denied”. To fix this, ensure the repository is accessible: either connect your GitHub/GitLab account to DigitalOcean (so App Platform can clone the repo using your credentials) or use a `git.repo_clone_url` with credentials. If using the latter, you might include a token in the clone URL (e.g., for GitHub: `https://<GH_TOKEN>:x-oauth-basic@github.com/user/repo.git`). Alternatively, make the repo public during the deployment. Once access is resolved, redeploy.

- **Build Failures (Deployment Failed):** If the deployment process starts but the site isn’t coming up, your `phase` may end up as `"ERROR"` or you get an alert for deployment failure. In this case, retrieve the build logs to see what went wrong. Use `GET /v2/apps/{app_id}/deployments/{deployment_id}/logs` to fetch logs ([GET /v2/apps/{app_id}/deployments/{deployment_id}/logs #248 - GitHub](https://github.com/digitalocean/openapi/issues/248#:~:text=GitHub%20github,248%20%C2%B7%20digitalocean%2Fopenapi)). Common issues for static sites include:  
  - **Incorrect build command:** The logs might show a command not found or an npm/yarn error. Double-check the `build_command` in your spec. For example, if your static site needs a build step (like a React app needing `npm run build`), ensure that command is correct and that any needed tools (like a specific Node version) are accounted for. App Platform tries to detect and use appropriate buildpacks, but specifying an `environment_slug` (e.g. node-js) can ensure the right environment. If you left `build_command` empty but your site actually needs one (e.g. a static generator), the build will essentially do nothing and might deploy an empty site – update the spec with the proper command and redeploy.  
  - **Wrong output directory:** If the build succeeded but the site shows a 404 on the preview URL, likely App Platform couldn’t find the static files. This happens if `output_dir` is wrong or not set. For instance, if your build outputs files to a `public/` directory but you didn’t specify that, App Platform may have looked in default locations and deployed nothing. The fix is to set `output_dir` to the correct folder where your static files end up (e.g. `"public"` or `"build"`). You can confirm in the logs – they often list the detected buildpack and what folder they deployed. Update the spec and redeploy.  
  - **Missing index or 404 configuration:** By default, App Platform expects an `index.html` in your output. If your site has a different structure, ensure an `index_document` is set (defaults to `index.html`) ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites)). Also, for single-page applications (SPAs) with client-side routing, it’s often useful to set a catch-all. In the spec, you can set `"catchall_document": "index.html"` so that any 404s will serve the index (useful for React Router or similar) ([
    
        Reference for App Specification | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/app-spec/#:~:text=output_dir%3A%20build%20index_document%3A%20index,com%20scope%3A%20RUN_TIME)). If you forget this, navigating to a sub-path might show a DigitalOcean 404 page. You can update the app spec to add this and redeploy.
  - **Environment issues:** If you needed environment variables at build time (for example, API keys for a Gatsby build) and forgot to include them, the build might fail or produce incorrect output. Add any required `envs` with `scope: BUILD_TIME` for build-only vars ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites)). For runtime config in a static app (like injecting an API URL), you may need to handle that in your build or use a placeholder that gets replaced at build time, since pure static hosting won’t execute backend code.

- **Rollbacks:** If a deployment fails but the previous deployment was working, your app will still be serving the last good deployment. You can confirm this via the API (`active_deployment` might still show the older deployment as active while a newer one is in error). To roll back explicitly via API, there is an endpoint `POST /v2/apps/{app_id}/rollback` where you can specify a prior deployment ID to revert to ([POST /v2/apps/{app_id}/rollback | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-app_id-rollback-post-619#:~:text=POST%20%2Fv2%2Fapps%2F,Auto%20Deploy%20on%20Push%20webhooks)). In practice for static sites, it’s often easier to fix and redeploy, but rollback is available if needed.

- **Cleaning Up:** If you need to delete the app, use `DELETE /v2/apps/{app_id}`. Ensure you supply the app ID and auth header. This will remove the app and stop deployments. Use this carefully (it’s irreversible, except by re-creating the app).

**Common API error format:** Most error responses from the DigitalOcean API include a JSON with an `"id"` (machine-readable error code) and a `"message"` (human-readable explanation). For example, trying to fetch a non-existent app might return `{"id":"not_found","message":"not found"}`. Always check the `message` – it often pinpoints the issue (e.g., “spec is invalid: ...”, “authentication failed”, etc.). The `id` codes for App Platform errors are documented (e.g., `DEPLOYMENT_FAILED`, `DOMAIN_FAILED` for alerts) but the message is usually sufficient to guide you.

By following this guide, you can automate the deployment of a static website on DigitalOcean App Platform using only API calls. You authenticate with a token, POST your app spec to create the app, then watch the deployment status and troubleshoot if needed – all via HTTP requests. This removes the need to click through the UI or use the CLI, which is ideal for CI/CD pipelines or automation workflows. With correct setup and spec, the process is smooth: your static site will be live on App Platform, and you can manage updates by pushing to your repo or hitting the deployment endpoint as needed.

**Sources:**

- DigitalOcean Documentation – *Personal Access Tokens & Authentication* ([
    
        How to Create a Personal Access Token | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/reference/api/create-personal-access-token/#:~:text=To%20use%20the%20DigitalOcean%20API%2C,header%20with%20your%20request)) ([Limit Scope of API Token to Resource(s) | DigitalOcean](https://www.digitalocean.com/community/questions/limit-scope-of-api-token-to-resource-s#:~:text=,Platform%20apps%20and%20their%20logs))  
- DigitalOcean Documentation – *App Spec Reference and Examples* ([Hosting Static Content with DigitalOcean - Elmar Klausmeier's Blog on Computers, Programming, and Mathematics](https://eklausmeier.goip.de/blog/2024/10-13-hosting-static-content-with-digitalocean#:~:text=region%3A%20fra%20static_sites%3A%20,io%20source_dir%3A)) ([
    
        Reference for App Specification | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/app-spec/#:~:text=git%3A%20repo_clone_url%3A%20https%3A%2F%2Fgithub.com%2Fuser%2Frepo,name)) ([
    
        Reference for App Specification | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/app-spec/#:~:text=dockerfile_path%3A%20,html%20envs)) ([POST /v2/apps | DigitalOcean | Integrations | SimWorkflow](https://www.simworkflow.com/integration-operation/digitalocean-v2-apps-post-e5e#:~:text=%60spec.static_sites))  
- DigitalOcean API Reference – *App Platform Endpoints* ([
    
        App Platform Reference | DigitalOcean Documentation
    
    ](https://docs.digitalocean.com/products/app-platform/reference/#:~:text=The%20DigitalOcean%20API%20lets%20you,also%20available%20through%20the%20API)) ([How to use curl in gitlab-ci file? - Stack Overflow](https://stackoverflow.com/questions/51790984/how-to-use-curl-in-gitlab-ci-file#:~:text=variables%3A%20DEPLOY_CURL_COMMAND_BODY%3A%20,Deploy%20to%20DigitalOcean%20App%20Platform))  
- DigitalOcean Community Q&A – *Common errors and fixes* ([python - DigitalOcean API Error When Creating New App - api.digitalocean.com/v2/apps - Stack Overflow](https://stackoverflow.com/questions/70423692/digitalocean-api-error-when-creating-new-app-api-digitalocean-com-v2-apps#:~:text=,invalid%20character%20%27s%27%20looking%20for))

