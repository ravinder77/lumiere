variable "environment" {
  description = "Environment name."
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name used in resource names."
  type        = string
  default     = "lumiere"
}

variable "aws_region" {
  description = "AWS region."
  type        = string
  default     = "ap-south-1"
}

variable "availability_zones" {
  description = "Availability zones used by the VPC."
  type        = list(string)
  default     = ["ap-south-1a", "ap-south-1b"]
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks."
  type        = list(string)
  default     = ["10.20.0.0/20", "10.20.16.0/20"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks."
  type        = list(string)
  default     = ["10.20.32.0/20", "10.20.48.0/20"]
}

variable "database_subnet_cidrs" {
  description = "Database subnet CIDR blocks."
  type        = list(string)
  default     = ["10.20.64.0/20", "10.20.80.0/20"]
}

variable "kubernetes_version" {
  description = "Kubernetes version for EKS. Null lets AWS select the default."
  type        = string
  default     = null
}

variable "node_instance_types" {
  description = "EKS node instance types."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_desired_size" {
  description = "Desired EKS node count."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum EKS node count."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum EKS node count."
  type        = number
  default     = 4
}

variable "cluster_addons" {
  description = "EKS add-ons to install after the cluster is created."
  type = map(object({
    addon_version               = optional(string)
    resolve_conflicts_on_create = optional(string, "OVERWRITE")
    resolve_conflicts_on_update = optional(string, "OVERWRITE")
  }))
  default = {
    coredns            = {}
    kube-proxy         = {}
    vpc-cni            = {}
    aws-ebs-csi-driver = {}
  }
}

variable "database_name" {
  description = "Initial PostgreSQL database name."
  type        = string
  default     = "lumiere"
}

variable "database_username" {
  description = "PostgreSQL master username."
  type        = string
  default     = "admin"
}

variable "database_password" {
  description = "PostgreSQL master password. Null generates one."
  type        = string
  default     = null
  sensitive   = true
}

variable "rds_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "domain_name" {
  description = "Root DNS domain. Change this before enabling create_dns_zone."
  type        = string
  default     = "lumiere.com"
}

variable "create_dns_zone" {
  description = "Whether to create the Route53 hosted zone."
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Existing Route53 hosted zone ID when create_dns_zone is false."
  type        = string
  default     = null
}

variable "enable_external_dns_irsa" {
  description = "Whether to create the ExternalDNS IRSA role."
  type        = bool
  default     = false
}

variable "github_org" {
  description = "GitHub organization or user that owns this repository."
  type        = string
  default     = "ravinder77"
}

variable "github_repo" {
  description = "GitHub repository name."
  type        = string
  default     = "lumiere"
}

variable "create_github_oidc_provider" {
  description = "Whether to create the GitHub Actions OIDC provider."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub Actions OIDC provider ARN when create_github_oidc_provider is false."
  type        = string
  default     = null
}

variable "tags" {
  description = "Additional common tags."
  type        = map(string)
  default     = {}
}
