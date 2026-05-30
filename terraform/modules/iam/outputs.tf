output "github_oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN."
  value       = local.github_oidc_provider_arn
}

output "github_actions_role_name" {
  description = "GitHub Actions IAM role name."
  value       = aws_iam_role.github_actions.name
}

output "github_actions_role_arn" {
  description = "GitHub Actions IAM role ARN."
  value       = aws_iam_role.github_actions.arn
}

output "github_actions_policy_arn" {
  description = "GitHub Actions base IAM policy ARN."
  value       = aws_iam_policy.github_actions.arn
}

output "github_subject_claims" {
  description = "GitHub OIDC subject claims allowed to assume the role."
  value       = local.github_subject_claims
}

output "external_dns_role_name" {
  description = "ExternalDNS IAM role name, when enabled."
  value       = try(aws_iam_role.external_dns[0].name, null)
}

output "external_dns_role_arn" {
  description = "ExternalDNS IAM role ARN, when enabled."
  value       = try(aws_iam_role.external_dns[0].arn, null)
}

output "external_dns_policy_arn" {
  description = "ExternalDNS Route53 IAM policy ARN, when enabled."
  value       = try(aws_iam_policy.external_dns[0].arn, null)
}

output "external_dns_service_account_annotation" {
  description = "Annotation to add to the ExternalDNS Kubernetes service account."
  value = try({
    "eks.amazonaws.com/role-arn" = aws_iam_role.external_dns[0].arn
  }, null)
}
