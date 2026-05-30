locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
  })

  github_actions_role_name = coalesce(var.github_actions_role_name, "${var.name_prefix}-github-actions")

  default_github_subject_claims = concat(
    [
      for branch in var.github_branch_names :
      "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/${branch}"
    ],
    [
      for tag in var.github_tag_patterns :
      "repo:${var.github_org}/${var.github_repo}:ref:refs/tags/${tag}"
    ],
    [
      for environment in var.github_environment_names :
      "repo:${var.github_org}/${var.github_repo}:environment:${environment}"
    ]
  )

  github_subject_claims    = length(var.github_subject_claims) > 0 ? var.github_subject_claims : local.default_github_subject_claims
  github_oidc_provider_arn = coalesce(var.github_oidc_provider_arn, try(aws_iam_openid_connect_provider.github[0].arn, null))

  external_dns_role_name         = coalesce(var.external_dns_role_name, "${var.name_prefix}-external-dns")
  external_dns_oidc_issuer_url   = var.external_dns_oidc_issuer_url == null ? null : trimsuffix(var.external_dns_oidc_issuer_url, "/")
  external_dns_oidc_hostpath     = local.external_dns_oidc_issuer_url == null ? null : replace(local.external_dns_oidc_issuer_url, "https://", "")
  external_dns_oidc_provider_arn = var.external_dns_oidc_provider_arn != null ? var.external_dns_oidc_provider_arn : try(aws_iam_openid_connect_provider.external_dns[0].arn, null)
  external_dns_subject           = "system:serviceaccount:${var.external_dns_namespace}:${var.external_dns_service_account_name}"
}

data "tls_certificate" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github[0].certificates[0].sha1_fingerprint]

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-github-oidc"
  })
}

data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    sid     = "GitHubActionsAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = local.github_subject_claims
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = local.github_actions_role_name
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json

  tags = merge(local.common_tags, {
    Name = local.github_actions_role_name
  })
}

data "aws_iam_policy_document" "github_actions" {
  statement {
    sid       = "EcrAuth"
    effect    = "Allow"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid    = "EcrImageReadWrite"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeImages",
      "ecr:DescribeRepositories",
      "ecr:GetDownloadUrlForLayer",
      "ecr:InitiateLayerUpload",
      "ecr:ListImages",
      "ecr:PutImage",
      "ecr:UploadLayerPart"
    ]
    resources = var.ecr_repository_arns
  }

  dynamic "statement" {
    for_each = var.allow_eks_deploy ? [1] : []

    content {
      sid       = "EksListClusters"
      effect    = "Allow"
      actions   = ["eks:ListClusters"]
      resources = ["*"]
    }
  }

  dynamic "statement" {
    for_each = var.allow_eks_deploy ? [1] : []

    content {
      sid       = "EksDescribeCluster"
      effect    = "Allow"
      actions   = ["eks:DescribeCluster"]
      resources = var.eks_cluster_arns
    }
  }
}

resource "aws_iam_policy" "github_actions" {
  name        = "${local.github_actions_role_name}-policy"
  description = "Permissions for Lumiere GitHub Actions CI/CD."
  policy      = data.aws_iam_policy_document.github_actions.json

  tags = merge(local.common_tags, {
    Name = "${local.github_actions_role_name}-policy"
  })
}

resource "aws_iam_role_policy_attachment" "github_actions" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

resource "aws_iam_policy" "github_actions_additional" {
  count = var.additional_policy_json == null ? 0 : 1

  name        = "${local.github_actions_role_name}-additional"
  description = "Additional permissions for Lumiere GitHub Actions CI/CD."
  policy      = var.additional_policy_json

  tags = merge(local.common_tags, {
    Name = "${local.github_actions_role_name}-additional"
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_additional" {
  count = var.additional_policy_json == null ? 0 : 1

  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions_additional[0].arn
}

data "tls_certificate" "external_dns" {
  count = var.enable_external_dns_irsa && var.create_external_dns_oidc_provider ? 1 : 0

  url = local.external_dns_oidc_issuer_url
}

resource "aws_iam_openid_connect_provider" "external_dns" {
  count = var.enable_external_dns_irsa && var.create_external_dns_oidc_provider ? 1 : 0

  url             = local.external_dns_oidc_issuer_url
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.external_dns[0].certificates[0].sha1_fingerprint]

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-eks-oidc"
  })
}

data "aws_iam_policy_document" "external_dns_assume_role" {
  count = var.enable_external_dns_irsa ? 1 : 0

  statement {
    sid     = "ExternalDNSAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.external_dns_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.external_dns_oidc_hostpath}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.external_dns_oidc_hostpath}:sub"
      values   = [local.external_dns_subject]
    }
  }
}

resource "aws_iam_role" "external_dns" {
  count = var.enable_external_dns_irsa ? 1 : 0

  name               = local.external_dns_role_name
  assume_role_policy = data.aws_iam_policy_document.external_dns_assume_role[0].json

  tags = merge(local.common_tags, {
    Name = local.external_dns_role_name
  })
}

data "aws_iam_policy_document" "external_dns" {
  count = var.enable_external_dns_irsa ? 1 : 0

  statement {
    sid    = "Route53RecordChanges"
    effect = "Allow"
    actions = [
      "route53:ChangeResourceRecordSets",
      "route53:ListResourceRecordSets"
    ]
    resources = var.external_dns_route53_zone_arns
  }

  statement {
    sid    = "Route53HostedZoneDiscovery"
    effect = "Allow"
    actions = [
      "route53:ListHostedZones",
      "route53:ListHostedZonesByName"
    ]
    resources = ["*"]
  }

  statement {
    sid       = "Route53ChangeStatus"
    effect    = "Allow"
    actions   = ["route53:GetChange"]
    resources = ["arn:aws:route53:::change/*"]
  }
}

resource "aws_iam_policy" "external_dns" {
  count = var.enable_external_dns_irsa ? 1 : 0

  name        = "${local.external_dns_role_name}-policy"
  description = "Route53 permissions for Kubernetes ExternalDNS."
  policy      = data.aws_iam_policy_document.external_dns[0].json

  tags = merge(local.common_tags, {
    Name = "${local.external_dns_role_name}-policy"
  })
}

resource "aws_iam_role_policy_attachment" "external_dns" {
  count = var.enable_external_dns_irsa ? 1 : 0

  role       = aws_iam_role.external_dns[0].name
  policy_arn = aws_iam_policy.external_dns[0].arn
}
