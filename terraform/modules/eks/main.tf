locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
  })

  node_group_name            = coalesce(var.node_group_name, "${var.name_prefix}-nodes")
  cluster_encryption_enabled = var.create_kms_key || var.kms_key_arn != null
  cluster_encryption_key_arn = var.kms_key_arn != null ? var.kms_key_arn : try(aws_kms_key.eks[0].arn, null)

  oidc_issuer_url   = aws_eks_cluster.main.identity[0].oidc[0].issuer
  oidc_hostpath     = replace(local.oidc_issuer_url, "https://", "")
  oidc_provider_arn = var.oidc_provider_arn != null ? var.oidc_provider_arn : try(aws_iam_openid_connect_provider.eks[0].arn, null)

  access_policy_associations = flatten([
    for entry_key, entry in var.access_entries : [
      for association_key, association in try(entry.policy_associations, {}) : {
        key           = "${entry_key}:${association_key}"
        principal_arn = entry.principal_arn
        policy_arn    = association.policy_arn
        access_scope  = association.access_scope
      }
    ]
  ])
}
