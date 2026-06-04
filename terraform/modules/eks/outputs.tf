output "cluster_name" {
  description = "EKS cluster name."
  value       = aws_eks_cluster.main.name
}

output "cluster_arn" {
  description = "EKS cluster ARN."
  value       = aws_eks_cluster.main.arn
}

output "cluster_id" {
  description = "EKS cluster ID."
  value       = aws_eks_cluster.main.id
}

output "cluster_endpoint" {
  description = "EKS Kubernetes API endpoint."
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64-encoded EKS cluster certificate authority data."
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "cluster_security_group_id" {
  description = "Security group created by EKS for the cluster."
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "cluster_role_name" {
  description = "IAM role name used by the EKS control plane."
  value       = aws_iam_role.cluster.name
}

output "cluster_role_arn" {
  description = "IAM role ARN used by the EKS control plane."
  value       = aws_iam_role.cluster.arn
}

output "kms_key_arn" {
  description = "KMS key ARN used for Kubernetes secret encryption, when configured."
  value       = local.cluster_encryption_key_arn
}

output "kms_key_id" {
  description = "KMS key ID created by this module, when create_kms_key is true."
  value       = try(aws_kms_key.eks[0].key_id, null)
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for the EKS cluster."
  value       = local.oidc_issuer_url
}

output "oidc_provider_arn" {
  description = "IAM OIDC provider ARN for the EKS cluster, when configured."
  value       = local.oidc_provider_arn
}

output "oidc_provider_url" {
  description = "IAM OIDC provider URL hostpath for trust policies."
  value       = local.oidc_hostpath
}

output "node_group_name" {
  description = "Managed node group name."
  value       = aws_eks_node_group.main.node_group_name
}

output "node_group_arn" {
  description = "Managed node group ARN."
  value       = aws_eks_node_group.main.arn
}

output "node_group_status" {
  description = "Managed node group status."
  value       = aws_eks_node_group.main.status
}

output "node_role_name" {
  description = "IAM role name used by EKS worker nodes."
  value       = aws_iam_role.node.name
}

output "node_role_arn" {
  description = "IAM role ARN used by EKS worker nodes."
  value       = aws_iam_role.node.arn
}

output "addon_names" {
  description = "Installed EKS add-on names."
  value       = keys(aws_eks_addon.this)
}

output "access_entry_arns" {
  description = "EKS access entry ARNs keyed by access entry name."
  value       = { for key, entry in aws_eks_access_entry.this : key => entry.access_entry_arn }
}

output "kubeconfig_command" {
  description = "AWS CLI command to update local kubeconfig for this cluster."
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name}"
}
