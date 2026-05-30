variable "name_prefix" {
  description = "Prefix used for naming IAM resources."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "tags" {
  description = "Common tags applied to all resources."
  type        = map(string)
  default     = {}
}

variable "github_org" {
  description = "GitHub organization or user that owns the repository."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name allowed to assume the CI/CD role."
  type        = string
}

variable "github_branch_names" {
  description = "GitHub branch names allowed to assume the CI/CD role."
  type        = list(string)
  default     = ["main"]
}

variable "github_tag_patterns" {
  description = "GitHub tag patterns allowed to assume the CI/CD role."
  type        = list(string)
  default     = ["v*"]
}

variable "github_environment_names" {
  description = "GitHub environment names allowed to assume the CI/CD role."
  type        = list(string)
  default     = ["dev", "staging", "prod"]
}

variable "github_subject_claims" {
  description = "Explicit GitHub OIDC subject claims. When empty, claims are built from repository, branches, tags, and environments."
  type        = list(string)
  default     = []
}

variable "create_github_oidc_provider" {
  description = "Whether to create the GitHub Actions OIDC provider."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub Actions OIDC provider ARN. Required when create_github_oidc_provider is false."
  type        = string
  default     = null
}

variable "github_actions_role_name" {
  description = "Name for the GitHub Actions role. Null uses '<name_prefix>-github-actions'."
  type        = string
  default     = null
}

variable "ecr_repository_arns" {
  description = "ECR repository ARNs the GitHub Actions role can push, pull, and sign."
  type        = list(string)
  default     = ["*"]
}

variable "eks_cluster_arns" {
  description = "EKS cluster ARNs the GitHub Actions role can describe for deployment."
  type        = list(string)
  default     = ["*"]
}

variable "allow_eks_deploy" {
  description = "Whether the GitHub Actions role can call EKS describe/list APIs needed by aws eks update-kubeconfig."
  type        = bool
  default     = true
}

variable "additional_policy_json" {
  description = "Additional IAM policy JSON attached to the GitHub Actions role. Null skips it."
  type        = string
  default     = null
}

variable "enable_external_dns_irsa" {
  description = "Whether to create an IRSA role and Route53 policy for ExternalDNS."
  type        = bool
  default     = false
}

variable "external_dns_role_name" {
  description = "IAM role name for ExternalDNS. Null uses '<name_prefix>-external-dns'."
  type        = string
  default     = null
}

variable "external_dns_namespace" {
  description = "Kubernetes namespace where ExternalDNS will run."
  type        = string
  default     = "external-dns"
}

variable "external_dns_service_account_name" {
  description = "Kubernetes service account name used by ExternalDNS."
  type        = string
  default     = "external-dns"
}

variable "external_dns_route53_zone_arns" {
  description = "Route53 hosted zone ARNs ExternalDNS can manage. Use DNS module output zone_arn here."
  type        = list(string)
  default     = ["*"]
}

variable "create_external_dns_oidc_provider" {
  description = "Whether to create the EKS OIDC provider used by ExternalDNS IRSA."
  type        = bool
  default     = false
}

variable "external_dns_oidc_issuer_url" {
  description = "EKS cluster OIDC issuer URL. Required when create_external_dns_oidc_provider is true."
  type        = string
  default     = null
}

variable "external_dns_oidc_provider_arn" {
  description = "Existing EKS OIDC provider ARN for ExternalDNS IRSA. Required when create_external_dns_oidc_provider is false and enable_external_dns_irsa is true."
  type        = string
  default     = null
}
