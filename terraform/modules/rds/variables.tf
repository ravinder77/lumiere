variable "name_prefix" {
  description = "Prefix used for naming RDS resources."
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

variable "subnet_ids" {
  description = "Database subnet IDs for the RDS subnet group."
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) >= 2
    error_message = "subnet_ids must include at least two database subnets."
  }
}

variable "security_group_ids" {
  description = "Security group IDs attached to the RDS instance."
  type        = list(string)
}

variable "identifier" {
  description = "RDS instance identifier. Null uses '<name_prefix>-postgres'."
  type        = string
  default     = null
}

variable "database_name" {
  description = "Initial database name."
  type        = string
  default     = "lumiere"
}

variable "master_username" {
  description = "Master username."
  type        = string
  default     = "admin"
}

variable "master_password" {
  description = "Master password. Null generates one and optionally stores it in Secrets Manager."
  type        = string
  default     = null
  sensitive   = true
}

variable "engine_version" {
  description = "PostgreSQL engine version. Null lets AWS select the default for the engine."
  type        = string
  default     = null
}

variable "instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Initial storage in GiB."
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Autoscaling storage limit in GiB. Set 0 to disable storage autoscaling."
  type        = number
  default     = 100
}

variable "storage_type" {
  description = "RDS storage type."
  type        = string
  default     = "gp3"
}

variable "storage_encrypted" {
  description = "Whether storage encryption is enabled."
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID or ARN for storage encryption. Null uses the AWS managed key."
  type        = string
  default     = null
}

variable "port" {
  description = "PostgreSQL port."
  type        = number
  default     = 5432
}

variable "multi_az" {
  description = "Whether to deploy a Multi-AZ RDS instance."
  type        = bool
  default     = false
}

variable "publicly_accessible" {
  description = "Whether the RDS instance is publicly accessible."
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Backup retention in days."
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window."
  type        = string
  default     = "18:30-19:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window."
  type        = string
  default     = "sun:19:30-sun:20:30"
}

variable "deletion_protection" {
  description = "Whether deletion protection is enabled."
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Whether to skip a final snapshot when destroying the DB."
  type        = bool
  default     = false
}

variable "apply_immediately" {
  description = "Whether DB modifications apply immediately."
  type        = bool
  default     = false
}

variable "auto_minor_version_upgrade" {
  description = "Whether minor engine upgrades are applied automatically."
  type        = bool
  default     = true
}

variable "enabled_cloudwatch_logs_exports" {
  description = "PostgreSQL logs exported to CloudWatch."
  type        = list(string)
  default     = ["postgresql", "upgrade"]
}

variable "performance_insights_enabled" {
  description = "Whether Performance Insights is enabled."
  type        = bool
  default     = true
}

variable "monitoring_interval" {
  description = "Enhanced monitoring interval in seconds. Set 0 to disable."
  type        = number
  default     = 0
}

variable "monitoring_role_arn" {
  description = "IAM role ARN for enhanced monitoring."
  type        = string
  default     = null
}

variable "create_parameter_group" {
  description = "Whether to create a DB parameter group."
  type        = bool
  default     = true
}

variable "parameter_group_family" {
  description = "DB parameter group family."
  type        = string
  default     = "postgres16"
}

variable "parameters" {
  description = "DB parameter group parameters."
  type = list(object({
    name         = string
    value        = string
    apply_method = optional(string)
  }))
  default = []
}

variable "create_secret" {
  description = "Whether to store DB connection details in Secrets Manager."
  type        = bool
  default     = true
}

variable "secret_name" {
  description = "Secrets Manager secret name. Null uses '<name_prefix>/rds/postgres'."
  type        = string
  default     = null
}
