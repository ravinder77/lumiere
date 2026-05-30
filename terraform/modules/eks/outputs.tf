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

output "oidc_issuer_url" {
  description = "OIDC issuer URL for the EKS cluster."
  value       = aws_eks_cluster.main.identity[0].oidc[0].issuer
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

output "kubeconfig_command" {
  description = "AWS CLI command to update local kubeconfig for this cluster."
  value       = "aws eks update-kubeconfig --name ${aws_eks_cluster.main.name}"
}
