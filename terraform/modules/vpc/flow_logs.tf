
# ── VPC Flow Logs → S3 ───────────────────────────────────────────────────────
resource "aws_flow_log" "s3" {
  log_destination      = "${var.flow_logs_bucket_arn}/vpc-flow-logs"
  log_destination_type = "s3"
  traffic_type         = "ALL"
  vpc_id               = aws_vpc.main.id

  destination_options {
    file_format        = "parquet"
    per_hour_partition = true
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-flow-logs"
  })

}

