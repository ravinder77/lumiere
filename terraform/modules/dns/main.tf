locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
  })

  zone_name = trimsuffix(var.domain_name, ".")
  zone_id   = var.create_zone ? aws_route53_zone.this[0].zone_id : var.zone_id
}

resource "aws_route53_zone" "this" {
  count = var.create_zone ? 1 : 0

  name          = local.zone_name
  comment       = coalesce(var.comment, "Managed hosted zone for ${local.zone_name}")
  force_destroy = var.force_destroy

  dynamic "vpc" {
    for_each = var.private_zone ? [1] : []

    content {
      vpc_id     = var.vpc_id
      vpc_region = var.vpc_region
    }
  }

  tags = merge(local.common_tags, {
    Name = "${var.name_prefix}-${local.zone_name}"
  })
}
