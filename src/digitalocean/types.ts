/**
 * DigitalOcean API types
 */

// App Spec types
export interface GitSource {
  repo: string;
  branch: string;
  deploy_on_push: boolean;
}

export interface StaticSite {
  name: string;
  github?: GitSource;
  git?: {
    repo_clone_url: string;
    branch: string;
  };
  gitlab?: GitSource;
  bitbucket?: GitSource;
  environment_slug?: string;
  source_dir: string;
  build_command?: string;
  output_dir?: string;
  index_document?: string;
  catchall_document?: string;
  envs?: EnvironmentVariable[];
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  type?: "GENERAL" | "SECRET";
  scope?: "BUILD_TIME" | "RUN_TIME" | "RUN_AND_BUILD_TIME";
}

export interface Domain {
  name: string;
  type?: "PRIMARY" | "ALIAS";
  zone?: string;
}

export interface Alert {
  rule: string;
}

export interface AppSpec {
  name: string;
  region: string;
  static_sites: StaticSite[];
  domains?: Domain[];
  alerts?: Alert[];
}

// API Response types
export interface AppResponse {
  app: {
    id: string;
    spec: AppSpec;
    default_ingress: string;
    active_deployment?: DeploymentResponse;
    created_at: string;
  };
}

export interface DeploymentResponse {
  id: string;
  phase: string;
  created_at: string;
  updated_at: string;
}

export interface DeploymentListResponse {
  deployments: DeploymentResponse[];
}

export interface LogResponse {
  historic: LogEntry[];
  live: LogEntry[];
}

export interface LogEntry {
  component_name: string;
  message: string;
  timestamp: string;
} 