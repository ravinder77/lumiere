output "db_instance_id" {
  description = "RDS instance ID."
  value       = aws_db_instance.this.id
}

output "db_instance_arn" {
  description = "RDS instance ARN."
  value       = aws_db_instance.this.arn
}

output "db_instance_identifier" {
  description = "RDS instance identifier."
  value       = aws_db_instance.this.identifier
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint."
  value       = aws_db_instance.this.endpoint
}

output "db_instance_address" {
  description = "RDS instance hostname."
  value       = aws_db_instance.this.address
}

output "db_instance_port" {
  description = "RDS instance port."
  value       = aws_db_instance.this.port
}

output "db_name" {
  description = "Database name."
  value       = aws_db_instance.this.db_name
}

output "master_username" {
  description = "Master username."
  value       = aws_db_instance.this.username
}

output "db_subnet_group_name" {
  description = "DB subnet group name."
  value       = aws_db_subnet_group.this.name
}

output "parameter_group_name" {
  description = "DB parameter group name, when created."
  value       = try(aws_db_parameter_group.this[0].name, null)
}

output "secret_arn" {
  description = "Secrets Manager secret ARN containing DB connection details, when created."
  value       = try(aws_secretsmanager_secret.db[0].arn, null)
}

output "database_url" {
  description = "PostgreSQL connection URL."
  value       = "postgresql://${aws_db_instance.this.username}:${urlencode(local.master_password)}@${aws_db_instance.this.address}:${aws_db_instance.this.port}/${aws_db_instance.this.db_name}?schema=public"
  sensitive   = true
}
