output "vpc_id" {
  description = "VPC ID."
  value       = module.vpc.vpc_id
}

output "flow_logs_bucket_name" {
  description = "VPC flow logs bucket name."
  value       = module.s3.flow_logs_bucket_name
}

output "flow_logs_bucket_arn" {
  description = "VPC flow logs bucket ARN."
  value       = module.s3.flow_logs_bucket_arn
}

output "private_subnet_ids" {
  description = "Private subnet IDs."
  value       = module.vpc.private_subnet_ids
}

output "database_subnet_ids" {
  description = "Database subnet IDs."
  value       = module.vpc.database_subnet_ids
}

output "eks_cluster_name" {
  description = "EKS cluster name."
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint."
  value       = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  description = "RDS endpoint."
  value       = module.rds.db_instance_endpoint
}

output "rds_secret_arn" {
  description = "Secrets Manager secret ARN for RDS connection details."
  value       = module.rds.secret_arn
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID."
  value       = module.dns.zone_id
}

output "route53_name_servers" {
  description = "Route53 hosted zone name servers."
  value       = module.dns.name_servers
}

output "github_actions_role_arn" {
  description = "GitHub Actions role ARN."
  value       = module.iam.github_actions_role_arn
}

output "external_dns_role_arn" {
  description = "ExternalDNS role ARN, when enabled."
  value       = module.iam.external_dns_role_arn
}

output "kubeconfig_command" {
  description = "Command to configure kubeconfig."
  value       = "${module.eks.kubeconfig_command} --region ${var.aws_region}"
}
