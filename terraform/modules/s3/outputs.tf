output "flow_logs_bucket_id" {
  description = "VPC flow logs bucket ID."
  value       = aws_s3_bucket.flow_logs.id
}

output "flow_logs_bucket_name" {
  description = "VPC flow logs bucket name."
  value       = aws_s3_bucket.flow_logs.bucket
}

output "flow_logs_bucket_arn" {
  description = "VPC flow logs bucket ARN."
  value       = aws_s3_bucket.flow_logs.arn
}

output "flow_logs_prefix" {
  description = "S3 prefix used for VPC flow logs."
  value       = var.flow_logs_prefix
}

output "flow_logs_destination_arn" {
  description = "Full S3 ARN prefix suitable for aws_flow_log.log_destination."
  value       = "${aws_s3_bucket.flow_logs.arn}/${var.flow_logs_prefix}"
}
