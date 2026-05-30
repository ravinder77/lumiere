variable "name_prefix" {
  description = "Prefix used for naming EKS resources."
  type        = string
}

variable "cluster_name" {
  description = "EKS cluster name."
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

variable "kubernetes_version" {
  description = "Kubernetes version for the EKS control plane and managed node group. Null lets AWS use the current default."
  type        = string
  default     = null
}

variable "cluster_subnet_ids" {
  description = "Subnet IDs used by the EKS control plane."
  type        = list(string)

  validation {
    condition     = length(var.cluster_subnet_ids) >= 2
    error_message = "cluster_subnet_ids must include at least two subnets."
  }
}

variable "node_subnet_ids" {
  description = "Subnet IDs for the managed node group. Use private subnets for production."
  type        = list(string)

  validation {
    condition     = length(var.node_subnet_ids) >= 2
    error_message = "node_subnet_ids must include at least two subnets."
  }
}

variable "cluster_security_group_ids" {
  description = "Additional security group IDs attached to the EKS control plane ENIs."
  type        = list(string)
  default     = []
}

variable "endpoint_private_access" {
  description = "Whether the EKS private API endpoint is enabled."
  type        = bool
  default     = true
}

variable "endpoint_public_access" {
  description = "Whether the EKS public API endpoint is enabled."
  type        = bool
  default     = true
}

variable "public_access_cidrs" {
  description = "CIDR blocks allowed to reach the public EKS API endpoint."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enabled_cluster_log_types" {
  description = "Control plane log types to enable."
  type        = list(string)
  default     = ["api", "audit", "authenticator"]
}

variable "cluster_log_retention_days" {
  description = "CloudWatch retention in days for EKS control plane logs."
  type        = number
  default     = 30
}

variable "authentication_mode" {
  description = "EKS access authentication mode."
  type        = string
  default     = "API_AND_CONFIG_MAP"

  validation {
    condition     = contains(["CONFIG_MAP", "API", "API_AND_CONFIG_MAP"], var.authentication_mode)
    error_message = "authentication_mode must be CONFIG_MAP, API, or API_AND_CONFIG_MAP."
  }
}

variable "bootstrap_cluster_creator_admin_permissions" {
  description = "Whether the principal creating the cluster gets admin access."
  type        = bool
  default     = true
}

variable "node_group_name" {
  description = "Managed node group name. Null uses '<name_prefix>-nodes'."
  type        = string
  default     = null
}

variable "node_instance_types" {
  description = "EC2 instance types for the managed node group."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "node_capacity_type" {
  description = "Capacity type for the managed node group."
  type        = string
  default     = "ON_DEMAND"

  validation {
    condition     = contains(["ON_DEMAND", "SPOT"], var.node_capacity_type)
    error_message = "node_capacity_type must be ON_DEMAND or SPOT."
  }
}

variable "node_ami_type" {
  description = "AMI type for the managed node group."
  type        = string
  default     = "AL2023_x86_64_STANDARD"
}

variable "node_disk_size" {
  description = "Worker node root volume size in GiB."
  type        = number
  default     = 30
}

variable "node_desired_size" {
  description = "Desired worker node count."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum worker node count."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum worker node count."
  type        = number
  default     = 4
}

variable "node_max_unavailable" {
  description = "Maximum unavailable nodes during managed node group updates."
  type        = number
  default     = 1
}

variable "node_labels" {
  description = "Labels applied to all nodes in the managed node group."
  type        = map(string)
  default     = {}
}

variable "node_taints" {
  description = "Taints applied to all nodes in the managed node group."
  type = list(object({
    key    = string
    value  = optional(string)
    effect = string
  }))
  default = []
}

variable "cluster_addons" {
  description = "EKS add-ons to install after the cluster is created."
  type = map(object({
    addon_version               = optional(string)
    resolve_conflicts_on_create = optional(string, "OVERWRITE")
    resolve_conflicts_on_update = optional(string, "OVERWRITE")
  }))
  default = {
    coredns    = {}
    kube-proxy = {}
    vpc-cni    = {}
  }
}
