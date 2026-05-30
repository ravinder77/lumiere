# --- VPC Endpoint -> keep traffic off the internet ------

locals {
  gateway_endpoints = ["s3", "dynamodb"]
  interface_endpoints = [
    "ec2", "ecr.api", "ecr.dkr", "sts", "logs",
    "secretsmanager", "kms", "ssm", "ssmmessages",
    "ec2messages", "elasticloadbalancing"
  ]
}

resource "aws_vpc_endpoint" "gateway" {
  for_each = toset(local.gateway_endpoints)

  vpc_id = aws_vpc.main.id
  service_name = "com.amazonaws.${var.aws_region}.${each.key}"
  vpc_endpoint_type = "Gateway"
  route_table_ids = concat(
    aws_route_table.private[*].id, [aws_route_table.database.id]
  )

  tags = merge(var.tags, { Name = "${var.name_prefix}-ep-${each.key}" })
}