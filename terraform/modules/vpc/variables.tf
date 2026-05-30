variable "name_prefix" {
  type = string
}

variable "cluster_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "vpc_cidr" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "availability_zones" {
  type = list(string)
}

variable "public_subnet_cidrs" {
  type = list(string)

  validation {
    condition     = length(var.public_subnet_cidrs) == length(var.availability_zones)
    error_message = "public_subnet_cidrs must contain one CIDR per availability zone."
  }
}

variable "private_subnet_cidrs" {
  type = list(string)

  validation {
    condition     = length(var.private_subnet_cidrs) == length(var.availability_zones)
    error_message = "private_subnet_cidrs must contain one CIDR per availability zone."
  }
}


variable "database_subnet_cidrs" {
  type = list(string)

  validation {
    condition     = length(var.database_subnet_cidrs) == length(var.availability_zones)
    error_message = "database_subnet_cidrs must contain one CIDR per availabilty zone"
  }
}


variable "flow_logs_bucket_arn" {
  type = string
}
