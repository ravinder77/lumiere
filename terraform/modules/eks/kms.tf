resource "aws_kms_key" "eks" {
  count = var.create_kms_key && var.kms_key_arn == null ? 1 : 0

  description             = "KMS key for ${var.cluster_name} Kubernetes secret encryption"
  deletion_window_in_days = var.kms_key_deletion_window_in_days
  enable_key_rotation     = var.kms_key_enable_rotation

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-eks-secrets"
  })
}

resource "aws_kms_alias" "eks" {
  count = var.create_kms_key && var.kms_key_arn == null ? 1 : 0

  name          = "alias/${var.name_prefix}-eks-secrets"
  target_key_id = aws_kms_key.eks[0].key_id
}
