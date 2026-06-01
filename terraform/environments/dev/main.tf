locals {
  name_prefix  = "${var.project_name}-${var.environment}"
  cluster_name = "${local.name_prefix}-eks"

  common_tags = merge(var.tags, {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  })
}

module "s3" {
  source = "../../modules/s3"

  name_prefix = local.name_prefix
  environment = var.environment
  tags        = local.common_tags
}

module "vpc" {
  source = "../../modules/vpc"

  name_prefix           = local.name_prefix
  cluster_name          = local.cluster_name
  environment           = var.environment
  aws_region            = var.aws_region
  vpc_cidr              = var.vpc_cidr
  availability_zones    = var.availability_zones
  public_subnet_cidrs   = var.public_subnet_cidrs
  private_subnet_cidrs  = var.private_subnet_cidrs
  database_subnet_cidrs = var.database_subnet_cidrs
  flow_logs_bucket_arn  = module.s3.flow_logs_bucket_arn
  tags                  = local.common_tags

  depends_on = [module.s3]
}

module "eks" {
  source = "../../modules/eks"

  name_prefix        = local.name_prefix
  cluster_name       = local.cluster_name
  environment        = var.environment
  kubernetes_version = var.kubernetes_version

  cluster_subnet_ids = module.vpc.private_subnet_ids
  node_subnet_ids    = module.vpc.private_subnet_ids

  node_instance_types = var.node_instance_types
  node_desired_size   = var.node_desired_size
  node_min_size       = var.node_min_size
  node_max_size       = var.node_max_size
  cluster_addons      = var.cluster_addons

  tags = local.common_tags
}

resource "aws_vpc_security_group_ingress_rule" "rds_from_eks_cluster" {
  security_group_id            = module.vpc.rds_security_group_id
  referenced_security_group_id = module.eks.cluster_security_group_id
  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
}

module "rds" {
  source = "../../modules/rds"

  name_prefix        = local.name_prefix
  environment        = var.environment
  subnet_ids         = module.vpc.database_subnet_ids
  security_group_ids = [module.vpc.rds_security_group_id]

  database_name   = var.database_name
  master_username = var.database_username
  master_password = var.database_password
  instance_class  = var.rds_instance_class

  deletion_protection = false
  skip_final_snapshot = true

  tags = local.common_tags

  depends_on = [aws_vpc_security_group_ingress_rule.rds_from_eks_cluster]
}

module "dns" {
  source = "../../modules/dns"

  name_prefix = local.name_prefix
  environment = var.environment
  domain_name = var.domain_name
  create_zone = var.create_dns_zone
  zone_id     = var.route53_zone_id
  tags        = local.common_tags
}

module "iam" {
  source = "../../modules/iam"

  name_prefix = local.name_prefix
  environment = var.environment
  tags        = local.common_tags

  github_org                  = var.github_org
  github_repo                 = var.github_repo
  create_github_oidc_provider = var.create_github_oidc_provider
  github_oidc_provider_arn    = var.github_oidc_provider_arn

  eks_cluster_arns = [module.eks.cluster_arn]

  enable_external_dns_irsa          = var.enable_external_dns_irsa
  create_external_dns_oidc_provider = var.enable_external_dns_irsa
  external_dns_oidc_issuer_url      = module.eks.oidc_issuer_url
  external_dns_route53_zone_arns    = module.dns.zone_arn == null ? ["*"] : [module.dns.zone_arn]
}
