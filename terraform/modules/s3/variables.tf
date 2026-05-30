variable "name_prefix" {
  description = "Prefix used for naming S3 resources."
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

variable "flow_logs_bucket_name" {
  description = "Explicit VPC flow logs bucket name. Null uses '<name_prefix>-<account-id>-flow-logs'."
  type        = string
  default     = null
}

variable "flow_logs_prefix" {
  description = "S3 prefix used for VPC flow logs."
  type        = string
  default     = "vpc-flow-logs"
}

variable "flow_logs_expiration_days" {
  description = "Number of days to retain VPC flow logs."
  type        = number
  default     = 90
}

variable "force_destroy_flow_logs_bucket" {
  description = "Whether to delete all objects when destroying the flow logs bucket."
  type        = bool
  default     = false
}
