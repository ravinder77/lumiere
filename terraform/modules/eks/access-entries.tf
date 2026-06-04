resource "aws_eks_access_entry" "this" {
  for_each = var.access_entries

  cluster_name      = aws_eks_cluster.main.name
  principal_arn     = each.value.principal_arn
  kubernetes_groups = length(try(each.value.kubernetes_groups, [])) > 0 ? each.value.kubernetes_groups : null
  type              = try(each.value.type, "STANDARD")
  user_name         = try(each.value.user_name, null)

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-${each.key}-access-entry"
  })
}

resource "aws_eks_access_policy_association" "this" {
  for_each = {
    for association in local.access_policy_associations : association.key => association
  }

  cluster_name  = aws_eks_cluster.main.name
  principal_arn = each.value.principal_arn
  policy_arn    = each.value.policy_arn

  access_scope {
    type       = coalesce(try(each.value.access_scope.type, null), "cluster")
    namespaces = try(each.value.access_scope.namespaces, null)
  }

  depends_on = [aws_eks_access_entry.this]
}
