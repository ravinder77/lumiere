variable "name_prefix" {
  description = "Prefix used for naming DNS resources."
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

variable "domain_name" {
  description = "Root domain name for the hosted zone, for example example.com."
  type        = string
}

variable "create_zone" {
  description = "Whether to create the Route53 hosted zone. Set false to reference an existing zone_id."
  type        = bool
  default     = true
}

variable "zone_id" {
  description = "Existing Route53 hosted zone ID. Required when create_zone is false."
  type        = string
  default     = null
}

variable "private_zone" {
  description = "Whether the hosted zone is private."
  type        = bool
  default     = false
}

variable "vpc_id" {
  description = "VPC ID associated with a private hosted zone."
  type        = string
  default     = null
}

variable "vpc_region" {
  description = "VPC region associated with a private hosted zone."
  type        = string
  default     = null
}

variable "comment" {
  description = "Hosted zone comment. Null uses a default."
  type        = string
  default     = null
}

variable "force_destroy" {
  description = "Whether to destroy all records when destroying the hosted zone."
  type        = bool
  default     = false
}

variable "records" {
  description = "Optional Route53 records managed by Terraform. ExternalDNS can manage application records later."
  type = map(object({
    name    = string
    type    = string
    ttl     = optional(number)
    records = optional(list(string))
    alias = optional(object({
      name                   = string
      zone_id                = string
      evaluate_target_health = optional(bool, true)
    }))
  }))
  default = {}
}
