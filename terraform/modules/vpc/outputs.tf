output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block."
  value       = aws_vpc.main.cidr_block
}

output "internet_gateway_id" {
  description = "Internet gateway ID."
  value       = aws_internet_gateway.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs."
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs."
  value       = aws_subnet.database[*].id
}

output "public_route_table_id" {
  description = "Public route table ID."
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "Private route table IDs."
  value       = aws_route_table.private[*].id
}

output "database_route_table_id" {
  description = "Database route table ID."
  value       = aws_route_table.database.id
}

output "nat_gateway_ids" {
  description = "NAT gateway IDs."
  value       = aws_nat_gateway.main[*].id
}

output "alb_security_group_id" {
  description = "ALB security group ID."
  value       = aws_security_group.alb.id
}

output "eks_nodes_security_group_id" {
  description = "EKS nodes security group ID."
  value       = aws_security_group.eks_nodes.id
}

output "rds_security_group_id" {
  description = "RDS security group ID."
  value       = aws_security_group.rds.id
}

output "gateway_endpoint_ids" {
  description = "Gateway VPC endpoint IDs keyed by service short name."
  value       = { for service, endpoint in aws_vpc_endpoint.gateway : service => endpoint.id }
}
